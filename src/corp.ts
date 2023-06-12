import { CorpEmployeePosition, CorpUpgradeName, NS } from '@ns'

export async function main(ns: NS) {
    ns.disableLog('sleep');
    ns.clearLog();
    ns.tail();

    const CityName = ns.enums.CityName;
    const states = ['START', 'PURCHASE', 'PRODUCTION', 'EXPORT', 'SALE'];
    const jobs: CorpEmployeePosition[] = ["Operations", "Engineer", "Business", "Management", "Research & Development", "Intern", "Unassigned"];
    const cities = [CityName.Aevum, CityName.Chongqing, CityName.NewTokyo, CityName.Ishima, CityName.Volhaven, CityName.Sector12];
    const c = ns.corporation
    const tobaccoProductPrefix = "DeathSticksV";
    const stage = [0, 0]

    const constants = c.getConstants();

    const corp = c.getCorporation();
    const divisions = corp.divisions.map(d => c.getDivision(d))
    const div = divisions.find(d => d.type == "Tobacco");
    if (!div) return;
    const tobaccoName = div.name;
    const rdiv = divisions.find(d => d.type == "Restaurant")
    if (!rdiv) return;
    const restName = rdiv.name;
    const levelUpgrades: CorpUpgradeName[] = ["Smart Factories", "Smart Storage", "DreamSense", "Wilson Analytics", "Nuoptimal Nootropic Injector Implants", "Speech Processor Implants", "Neural Accelerators", "FocusWires", "ABC SalesBots", "Project Insight"]

    while (stage[0] >= 0) {
        while (c.getCorporation().state == states[0]) {
            await ns.sleep(10);
        }

        while (c.getCorporation().state != states[0]) {
            await ns.sleep(10);
        }
        await checkProducts(tobaccoName, tobaccoProductPrefix);
        await spendMoney(tobaccoName);
        await hirePeople(tobaccoName);
        await checkProducts(restName, "Katdonalds#");
        await spendMoney(restName);
        await hirePeople(restName);
        await teaParty(ns);
    }

    async function spendMoney(divisionName: string) {
        ns.tail()
        const corp = c.getCorporation();
        const growAveumCost = c.getOfficeSizeUpgradeCost(divisionName, cities[0], 15);
        const buyAdvertCost = c.getHireAdVertCost(divisionName);
        const citycosts = Object.fromEntries(cities.map(city => [city, c.getOfficeSizeUpgradeCost(divisionName, city, 15)]));
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
            c.upgradeOfficeSize(divisionName, cities[0], 15)
            ns.print(`Upgrading office in ${cities[0]}`)
        }
        else if (buyAdvertCost < corp.funds && corp.funds > buyAdvertCost) {
            
            c.hireAdVert(divisionName);
            ns.print(`hiring advert(${ns.formatNumber(buyAdvertCost)} < ${ns.formatNumber(growAveumCost)})`);
        }
        else if (citycosts[cheapestCityToUpgrade] < corp.funds && c.getOffice(divisionName, cheapestCityToUpgrade).size < c.getOffice(divisionName, cities[0]).size - 75) {
            c.upgradeOfficeSize(divisionName, cheapestCityToUpgrade, 15)
            ns.print(`upgrading office in ${cheapestCityToUpgrade}`)
        }
        else if (upgradeCosts[cheapestUpgrade] < corp.funds && c.getOffice(divisionName, cheapestCityToUpgrade).size > 60) {
            c.levelUpgrade(cheapestUpgrade);
            ns.print(`leveling upgrade ${cheapestUpgrade}`)
        }

    }

    async function hirePeople(divisionName: string) {
        while (c.hireEmployee(divisionName, cities[0])) { await ns.sleep(0) }
        c.setAutoJobAssignment(divisionName, cities[0], jobs[0], Math.floor(c.getOffice(divisionName, cities[0]).size / 5))
        c.setAutoJobAssignment(divisionName, cities[0], jobs[1], Math.floor(c.getOffice(divisionName, cities[0]).size / 5))
        c.setAutoJobAssignment(divisionName, cities[0], jobs[2], Math.floor(c.getOffice(divisionName, cities[0]).size / 5))
        c.setAutoJobAssignment(divisionName, cities[0], jobs[3], Math.ceil(c.getOffice(divisionName, cities[0]).size / 5))
        c.setAutoJobAssignment(divisionName, cities[0], jobs[4], Math.ceil(c.getOffice(divisionName, cities[0]).size / 5))

        for (const city of cities) {
            if (city == cities[0]) continue;
            const o = c.getOffice(divisionName, city);
            while (c.hireEmployee(divisionName, city)) { await ns.sleep(0) }
            jobs.map(j => c.setAutoJobAssignment(divisionName, city, j, 0));
            const empch = Math.floor((3 / 15) * o.size)
            const empcl = Math.floor((2 / 15) * o.size)
            c.setAutoJobAssignment(divisionName, city, jobs[0], empch)
            c.setAutoJobAssignment(divisionName, city, jobs[1], empch)
            c.setAutoJobAssignment(divisionName, city, jobs[2], empcl)
            c.setAutoJobAssignment(divisionName, city, jobs[3], empch)
            c.setAutoJobAssignment(divisionName, city, jobs[4], o.size - (3 * empch + empcl))

        }
    }

    async function checkProducts(divisionName: string, productPrefix: string) {
        const div = c.getDivision(divisionName);
        const maxProds = getMaxProducts(divisionName);
        const prods = div.products.map(p => c.getProduct(divisionName, cities[0], p));
        const nextProd = Math.max(...prods.map(p =>  isNaN(Number.parseInt(p.name.substring(productPrefix.length))) ? 0 : Number.parseInt(p.name.substring(productPrefix.length)))) + 1;
        await discontinueWorstProductIfFull();
        await createNewProductIfNotFull();
        SellAllProducts();

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
            if (prods.length < maxProds && c.getCorporation().funds > 2 * 1e9) {
                ns.print(`Devloping new product: ${productPrefix + nextProd.toString()}`);
                c.makeProduct(divisionName, cities[0], productPrefix + nextProd.toString(), 1e9, 1e9);
                await ns.sleep(10);
            }
        }

        async function discontinueWorstProductIfFull() {
            if (prods.length == maxProds && prods.filter(p => p.developmentProgress < 100).length == 0) {
                stage[1] += 1;
                if (stage[1] > 4) {
                    const worst = prods.reduce((p, c) => p.effectiveRating < c.effectiveRating ? p : c);
                    ns.print(`Discontinuing ${worst.name} (rating: ${ns.formatNumber(worst.effectiveRating)})`);
                    c.discontinueProduct(divisionName, worst.name);
                    await ns.sleep(10);
                    stage[1] = 0;
                }
                else {
                    ns.print("Products full, maturing");
                }
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

