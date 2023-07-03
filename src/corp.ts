import { CityName, CorpEmployeePosition, CorpUpgradeName, Division, NS, Office } from '@ns'


export async function main(ns: NS) {
    ns.disableLog('ALL');
    ns.clearLog();
    ns.tail();
    const states = ['START', 'PURCHASE', 'PRODUCTION', 'EXPORT', 'SALE'];
    const c = ns.corporation
    const tobaccoProductPrefix = "DeathSticksV";
    const stage = [0, 0]
    const cities = Object.values(ns.enums.CityName)

    const corp = c.getCorporation();
    const divisions = corp.divisions.map(d => c.getDivision(d))
    const div = divisions.find(d => d.type == "Tobacco");
    if (!div) return;
    const tobaccoName = div.name;
    const rdiv = divisions.find(d => d.type == "Restaurant")
    if (!rdiv) return;
    const restName = rdiv.name;
    const prodStages = [0, 0]
    while (stage[0] >= 0) {
        while (c.getCorporation().state == states[0]) {
            await ns.sleep(10);
        }
        while (c.getCorporation().state != states[2]) {
            await ns.sleep(0);
        }
        checkWarehouseCap(ns);
        while (c.getCorporation().state != states[0]) {
            await ns.sleep(10);
        }
        prodStages[0] = await checkProducts(ns, tobaccoName, tobaccoProductPrefix, prodStages[0]);
        await spendMoney(ns, tobaccoName);
        cities.forEach(city => hirePeople(ns, tobaccoName, city, "even"));
        prodStages[1] = await checkProducts(ns, restName, "Katdonalds#", prodStages[1]);
        await spendMoney(ns, restName);
        cities.forEach(city => hirePeople(ns, restName, city, "even"));
        await growMaterialProducers(ns);
        await teaParty(ns);
        divisions.filter(d => !d.makesProducts)
            .forEach(d => cities
                .forEach(city => hirePeople(ns, d.name, city, c.getOffice(d.name, city).size > 9 ? "even" : "starting")))
        await checkResearch(ns);
        //await checkExports(ns);
    }
}

export async function checkExports(ns: NS) {
    const c = ns.corporation;
    const corp = c.getCorporation();
    const divisions = corp.divisions.map(d => c.getDivision(d));
    const industries = divisions.map(d => c.getIndustryData(d.type));
    const chains: number[][] = [];
    divisions.filter(d => d.makesProducts).map(d => divisions.indexOf(d)).forEach(d => chains.push([d]));
}

export async function checkWarehouseCap(ns: NS) {
    const c = ns.corporation;
    const cities = Object.values(ns.enums.CityName);
    const corp = c.getCorporation();
    corp.divisions.map(d => c.getDivision(d)).forEach(division => {
        cities.forEach(city => {
            if (c.hasWarehouse(division.name, city)) {
                const wh = c.getWarehouse(division.name, city)
                if (wh.sizeUsed / wh.size > .9 && c.getUpgradeWarehouseCost(division.name, city, 1) < c.getCorporation().funds) {
                    c.upgradeWarehouse(division.name, city);
                }
            }
        })
    })
}

export async function growMaterialProducers(ns: NS) {
    const c = ns.corporation;
    const cities = Object.values(ns.enums.CityName);
    const corp = c.getCorporation();
    const divisions = corp.divisions.map(d => c.getDivision(d)).filter(d => !d.makesProducts && d.lastCycleRevenue == 0)
    if (divisions.length > 0) {
        const leastCost = divisions
            .map(division => cities
                .map(city => ({ division, city, cost: c.getOfficeSizeUpgradeCost(division.name, city, 3) }))
                .reduce((pre, cur) => pre.cost < cur.cost ? pre : cur))
            .reduce((pre, cur) => pre.cost < cur.cost ? pre : cur)
        if (corp.funds * 0.5 > leastCost.cost) {
            ns.print(`upgrade ${leastCost.city} division ${leastCost.division.name} for ${ns.formatNumber(leastCost.cost)}`)
            c.upgradeOfficeSize(leastCost.division.name, leastCost.city, 3);
        }
        divisions.forEach(d => {
            cities.forEach(city => {
                ugradeWarehouse(ns, d.name, city, 0.8, 0.2);
                buyProductionMaterials(ns, d, city, 0.8, 0.2);
            })
        })
    }

}

export function buyProductionMaterials(ns: NS, d: Division, city: CityName, warehouseProdRatio = 0.8, costRatio = 1) {
    const c = ns.corporation
    const prodMaterials = [c.getMaterialData("AI Cores"), c.getMaterialData("Hardware"), c.getMaterialData("Robots"), c.getMaterialData("Real Estate")]
    const warehouse = c.getWarehouse(d.name, city);
    if (warehouse.sizeUsed < warehouse.size * warehouseProdRatio) {
        const data = c.getIndustryData(d.type);
        const factors = [data.aiCoreFactor ?? 0, data.hardwareFactor ?? 0, data.robotFactor ?? 0, data.realEstateFactor ?? 0];
        const f = factors.map((d, i) => d * prodMaterials[i].size).reduce((prev, curr) => prev + curr, 0);
        const x = (warehouse.size * warehouseProdRatio) / f;
        const targets = factors.map(f => Math.ceil(x * f));
        prodMaterials.forEach((mdata, i) => {
            const material = c.getMaterial(d.name, city, mdata.name);
            if (((targets[i] - material.stored) > 0) && (((targets[i] - material.stored) * material.marketPrice) < c.getCorporation().funds * costRatio)) {
                ns.print(`Buying ${mdata.name} for ${d.name} in ${city}`);
                c.bulkPurchase(d.name, city, mdata.name, targets[i] - material.stored);
            }
        });
        if (data.producedMaterials) {
            data.producedMaterials.forEach(m => c.sellMaterial(d.name, city, m, "MAX", "MP * .9"));
        }
    }
}

export function ugradeWarehouse(ns: NS, divisionName: string, city: CityName, warehouseProdRatio = 0.8, warehouseCostRatio = 1) {
    const c = ns.corporation
    const warehouse = c.getWarehouse(divisionName, city);
    if (warehouse.sizeUsed > warehouse.size * warehouseProdRatio) {
        if (c.getUpgradeWarehouseCost(divisionName, city) < c.getCorporation().funds * warehouseCostRatio) {
            ns.print(`Upgrading warehouse for ${divisionName} in ${city}`);
            c.upgradeWarehouse(divisionName, city);
        }
    }
}

export async function checkResearch(ns: NS) {
    const c = ns.corporation;
    const lab = "Hi-Tech R&D Laboratory";
    const marketTA = "Market-TA.I";
    const marketTA2 = "Market-TA.II";

    const corp = c.getCorporation();
    corp.divisions.map(d => c.getDivision(d)).forEach(division => {
        if (division.researchPoints > 10000 && !c.hasResearched(division.name, lab)) {
            c.research(division.name, lab);
        }
        if (division.researchPoints > 1500000 && !c.hasResearched(division.name, marketTA2)) {
            c.research(division.name, marketTA);
            c.research(division.name, marketTA2);
        }
    })
}

export async function spendMoney(ns: NS, divisionName: string) {
    const c = ns.corporation;
    const constants = c.getConstants();
    const cities = Object.values(ns.enums.CityName);
    const levelUpgrades: CorpUpgradeName[] = ["Smart Factories", "Smart Storage", "DreamSense", "Wilson Analytics", "Nuoptimal Nootropic Injector Implants", "Speech Processor Implants", "Neural Accelerators", "FocusWires", "ABC SalesBots", "Project Insight"]
    const corp = c.getCorporation();
    const offices = cities.map(city => c.getOffice(divisionName, city));
    const growAveumCost = c.getOfficeSizeUpgradeCost(divisionName, offices[0].city, getOfficeUpgradeSize(offices[0]));
    const buyAdvertCost = c.getHireAdVertCost(divisionName);    
    const citycosts = Object.fromEntries(offices.map(office => [office.city, c.getOfficeSizeUpgradeCost(divisionName, office.city, getOfficeUpgradeSize(office))]));
    const cheapestCityToUpgrade = cities.reduce((prev, curr) => citycosts[prev] < citycosts[curr] ? prev : curr);
    const wilsonUpgradeCost = c.getUpgradeLevelCost(levelUpgrades[3])
    const upgradeLevels = Object.fromEntries(constants.upgradeNames.map(upgrade => [upgrade, c.getUpgradeLevel(upgrade)]))
    const upgrades = constants.upgradeNames.filter(u => upgradeLevels[u] < 100);
    const upgradeCosts = Object.fromEntries(upgrades.map(upgrade => [upgrade, c.getUpgradeLevelCost(upgrade)]))
    const cheapestUpgrade = upgrades.reduce((prev, curr) => upgradeCosts[prev] < upgradeCosts[curr] ? prev : curr);
    //console.log(citycosts, cheapestCityToUpgrade);
    // if attainable, upgrade wilson analytics
    if (corp.funds > wilsonUpgradeCost) {
        c.levelUpgrade(levelUpgrades[3])
        ns.print(`buying ${levelUpgrades[3]}`)
    }
    else if (corp.revenue * 600 > wilsonUpgradeCost) {
        ns.print(`waiting for ${levelUpgrades[3]} (${ns.formatNumber(corp.revenue * 600)}, ${ns.formatNumber(wilsonUpgradeCost)})`)
        return;

    }
    else if (growAveumCost < buyAdvertCost && corp.funds > growAveumCost) {
        const o = c.getOffice(divisionName, cities[0])
        c.upgradeOfficeSize(divisionName, cities[0], getOfficeUpgradeSize(o))
        ns.print(`Upgrading ${divisionName} office in ${cities[0]}`)
    }
    else if (buyAdvertCost < corp.funds && corp.funds > buyAdvertCost) {

        c.hireAdVert(divisionName);
        ns.print(`hiring advert for ${divisionName} (${ns.formatNumber(buyAdvertCost)} < ${ns.formatNumber(growAveumCost)})`);
    }
    else if (citycosts[cheapestCityToUpgrade] < corp.funds && (c.getOffice(divisionName, cheapestCityToUpgrade).size < c.getOffice(divisionName, cities[0]).size - 75 || c.getOffice(divisionName, cheapestCityToUpgrade).size % 15 > 0)) {
        ns.print(`upgrading ${divisionName} office in ${cheapestCityToUpgrade} ${getOfficeUpgradeSize(c.getOffice(divisionName, cheapestCityToUpgrade))}`)
        c.upgradeOfficeSize(divisionName, cheapestCityToUpgrade, getOfficeUpgradeSize(c.getOffice(divisionName, cheapestCityToUpgrade)))
    }
    else if (upgradeCosts[cheapestUpgrade] < corp.funds && c.getOffice(divisionName, cheapestCityToUpgrade).size > 30) {
        c.levelUpgrade(cheapestUpgrade);
        ns.print(`leveling upgrade ${cheapestUpgrade}`)
    }
    else {
        cities.forEach(city => {
            ugradeWarehouse(ns, divisionName, city, 0.6, 0.2);
            buyProductionMaterials(ns, c.getDivision(divisionName), city, 0.6, 0.2)
        })
    }

}

function getOfficeUpgradeSize(office: Office): number {
    return office.size % 15 > 0 ? 15 - office.size % 15 : 15;
}

export function hirePeople(ns: NS, divisionName: string, city: CityName, distribution: EmployeeDistributionNames) {
    const c = ns.corporation;
    const jobs: CorpEmployeePosition[] = ["Operations", "Engineer", "Business", "Management", "Research & Development", "Intern", "Unassigned"];
    let hired = 0;
    const o = c.getOffice(divisionName, city);
    while (c.hireEmployee(divisionName, city)) { hired += 1 }
    let x = Dist.get(distribution)
    if (o.size < 9) {
        x = Dist.get('starting');
    }
    if (!x) { return }
    jobs.map(j => c.setAutoJobAssignment(divisionName, city, j, 0));

    const dist = x(o.size);
    for (let i = 0; i < 6; i++) {
        c.setAutoJobAssignment(divisionName, city, jobs[i], dist[i])
    }
    return hired;
}

export async function checkProducts(ns: NS, divisionName: string, productPrefix: string, stage: number): Promise<number> {
    const c = ns.corporation;
    const CityName = ns.enums.CityName
    const div = c.getDivision(divisionName);
    const cities = [CityName.Aevum, CityName.Chongqing, CityName.NewTokyo, CityName.Ishima, CityName.Volhaven, CityName.Sector12];
    const maxProds = getMaxProducts(divisionName);
    const prods = div.products.map(p => c.getProduct(divisionName, cities[0], p));
    const nextProd = Math.max(...prods.map(p => isNaN(Number.parseInt(p.name.substring(productPrefix.length))) ? 0 : Number.parseInt(p.name.substring(productPrefix.length)))) + 1;
    await discontinueWorstProductIfFull();
    await createNewProductIfNotFull();
    SellAllProducts();
    return stage;

    function SellAllProducts() {
        const div = c.getDivision(divisionName);
        const prods = div.products.map(p => c.getProduct(divisionName, cities[0], p));
        cities.forEach(city => {
            prods.forEach(p => {
                const product = c.getProduct(divisionName, city, p.name);
                if (product.desiredSellAmount == 0 || product.desiredSellPrice == 0) {
                    c.sellProduct(divisionName, city, product.name, "MAX", "MP", false);

                }
                if (c.hasResearched(divisionName, "Market-TA.II")) {
                    c.setProductMarketTA2(divisionName, product.name, true);
                }
            });
        });
    }

    async function createNewProductIfNotFull() {
        const div = c.getDivision(divisionName);
        const prods = div.products.map(p => c.getProduct(divisionName, cities[0], p));
        if (prods.length < maxProds && c.getCorporation().funds > 2 * 1e9 && c.hasWarehouse(divisionName, cities[0])) {
            ns.print(`Devloping new product: ${productPrefix + nextProd.toString()}`);
            c.makeProduct(divisionName, cities[0], productPrefix + nextProd.toString(), 1e9, 1e9);
            await ns.sleep(10);
        }
    }

    async function discontinueWorstProductIfFull() {
        if (prods.length == maxProds && prods.filter(p => p.developmentProgress < 100).length == 0) {
            stage += 1;
            if (stage > 4) {
                const worst = prods.reduce((p, c) => p.effectiveRating < c.effectiveRating ? p : c);
                ns.print(`Discontinuing ${worst.name} (rating: ${ns.formatNumber(worst.effectiveRating)})`);
                c.discontinueProduct(divisionName, worst.name);
                await ns.sleep(10);
                stage = 0;
            }
            else {
                ns.print("Products full, maturing");
            }
        }
    }

    function getMaxProducts(division: string): number {
        const div = c.getDivision(division);
        let max = 0;
        max += div.makesProducts ? 3 : 0;
        max += c.hasResearched(division, "uPgrade: Capacity.I") ? 1 : 0
        max += c.hasResearched(division, "uPgrade: Capacity.II") ? 1 : 0
        return max;
    }
}

export async function teaParty(ns: NS) {
    const c = ns.corporation
    const corp = c.getCorporation();
    for (const division of corp.divisions.map(d => c.getDivision(d))) {
        for (const city of division.cities) {
            const office = c.getOffice(division.name, city)
            if (office.avgEnergy < 98) {
                //ns.print(`Buying Tea for ${division.name} in ${city}`)
                c.buyTea(division.name, city)
            }
            if (office.avgMorale < 98) {
                //ns.print(`Throwing party for ${division.name} in ${city}`)
                c.throwParty(division.name, city, 200_000)
            }
        }
    }
}

export interface Distributor { (n: number): number[] }
export type EmployeeDistributionNames = "starting" | "researchFocus" | "even" | "evenHalfResearch" | "feeder";
export type EmployeeDistribution = {
    description: EmployeeDistributionNames
    distribute: Distributor;
}
function addRest(n: number, allocated: number[], index: number): void {
    //console.debug(allocated);
    allocated.forEach((r, i) => allocated[i] = Math.floor(r))
    while (allocated.length < 6) {
        allocated.push(0);
    }
    allocated[index] += n - allocated.reduce((p, c) => p + c, 0);
    //console.debug(allocated);
}
export const EmployeeDistributions: EmployeeDistribution[] =
    [
        {
            description: "starting",
            distribute: (n: number) => {
                const res = [n / 3, n / 3, n / 3];
                addRest(n, res, 4);

                return res;
            }
        },
        {
            description: "researchFocus",
            distribute: (n: number) => {
                let res = [0, 0, 0, 0, 0, 0];
                if (n > 5) {
                    res = [1, 1, 1, 1, 1, 0]
                }
                addRest(n, res, 4)
                return res;
            }
        },
        {
            description: "even",
            distribute: (n: number) => {
                const res = [n / 5, n / 5, n / 5, n / 5, n / 5, 0]
                addRest(n, res, 4);
                return res;
            }
        },
        {
            description: "evenHalfResearch",
            distribute: (n: number) => {
                const c = n / 9
                const res = [2 * c, 2 * c, 2 * c, 2 * c, c, 0]
                addRest(n, res, 4)
                return res;
            }
        },
        {
            description: "feeder",
            distribute: (n: number) => {
                const c = (n - 1) / 4
                const res = [c, c, 1, c, c]
                addRest(n, res, 0)
                return res;
            }
        }
    ]

export const Dist = new Map<EmployeeDistributionNames, Distributor>()
EmployeeDistributions.forEach(d => Dist.set(d.description, d.distribute))





