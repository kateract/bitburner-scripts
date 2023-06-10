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

    var corp = c.getCorporation();
    let divisions = corp.divisions.map(d => c.getDivision(d))
    let div = divisions.find(d => d.type == "Tobacco");
    if (!div) return;
    let tobaccoName = div.name;
    const levelUpgrades: CorpUpgradeName[] = ["Smart Factories", "Smart Storage", "DreamSense", "Wilson Analytics", "Nuoptimal Nootropic Injector Implants", "Speech Processor Implants", "Neural Accelerators", "FocusWires", "ABC SalesBots", "Project Insight"]
    
    while (true) {
        while (c.getCorporation().state == states[0]) {
            await ns.sleep(10);
        }

        while (c.getCorporation().state != states[0]) {
            await ns.sleep(10);
        }
        await checkProducts();
        await spendMoney();
        await hirePeople();
        await teaParty(ns);

        async function spendMoney() {
            ns.tail()
            corp = c.getCorporation();
            var growAveumCost = c.getOfficeSizeUpgradeCost(tobaccoName, cities[0], 15);
            var buyAdvertCost = c.getHireAdVertCost(tobaccoName);
            var citycosts = Object.fromEntries(cities.map(city => [city, c.getOfficeSizeUpgradeCost(tobaccoName, city, 15)]));
            var cheapestCityToUpgrade = cities.reduce((prev, curr) => citycosts[prev] < citycosts[curr] ? prev : curr);
            var growCheapestCityCost = citycosts[cheapestCityToUpgrade];
            var wilsonUpgradeCost = c.getUpgradeLevelCost(levelUpgrades[3])
            var upgradeLevels = Object.fromEntries(constants.upgradeNames.map(upgrade => [upgrade, c.getUpgradeLevel(upgrade)]))
            var upgrades = constants.upgradeNames.filter(u => upgradeLevels[u] < 100);
            var upgradeCosts = Object.fromEntries(upgrades.map(upgrade => [upgrade, c.getUpgradeLevelCost(upgrade)]))
            var cheapestUpgrade = upgrades.reduce((prev, curr) => upgradeCosts[prev] < upgradeCosts[curr] ? prev : curr);
            // if attainable, upgrade wilson analytics
            if (corp.funds > wilsonUpgradeCost) {
                c.levelUpgrade(levelUpgrades[3])
                ns.print(`buying ${levelUpgrades[3]}`)
            }
            else if (corp.revenue * 600 > wilsonUpgradeCost) {
                ns.print(`waiting for ${levelUpgrades[3]} (${ns.formatNumber(corp.revenue * 600)}, ${ns.formatNumber(wilsonUpgradeCost)})`)
                return;

            }
            else if (growAveumCost < buyAdvertCost && corp.funds > growAveumCost)
            {
                c.upgradeOfficeSize(tobaccoName, cities[0], 15)
                ns.print(`Upgrading office in ${cities[0]}`)
            }
            else if (buyAdvertCost < corp.funds) {
                c.hireAdVert(tobaccoName);
                ns.print(`hiring advert`);
            }
            else if (citycosts[cheapestCityToUpgrade] < corp.funds && c.getOffice(tobaccoName, cheapestCityToUpgrade).size < c.getOffice(tobaccoName, cities[0]).size - 75) {
                c.upgradeOfficeSize(tobaccoName, cheapestCityToUpgrade, 15)
                ns.print(`upgrading office in ${cheapestCityToUpgrade}`)
            }
            else if (upgradeCosts[cheapestUpgrade] < corp.funds) {
                c.levelUpgrade(cheapestUpgrade);
                ns.print(`leveling upgrade ${cheapestUpgrade}`)
            }

        }

        async function hirePeople() {
            while (c.hireEmployee(tobaccoName, cities[0])) { }
            c.setAutoJobAssignment(tobaccoName, cities[0], jobs[0], Math.floor(c.getOffice(tobaccoName, cities[0]).size / 5))
            c.setAutoJobAssignment(tobaccoName, cities[0], jobs[1], Math.floor(c.getOffice(tobaccoName, cities[0]).size / 5))
            c.setAutoJobAssignment(tobaccoName, cities[0], jobs[2], Math.floor(c.getOffice(tobaccoName, cities[0]).size / 5))
            c.setAutoJobAssignment(tobaccoName, cities[0], jobs[3], Math.ceil(c.getOffice(tobaccoName, cities[0]).size / 5))
            c.setAutoJobAssignment(tobaccoName, cities[0], jobs[4], Math.ceil(c.getOffice(tobaccoName, cities[0]).size / 5))

            for (let city of cities) {
                if (city == cities[0]) continue;
                let o = c.getOffice(tobaccoName, city);
                while (c.hireEmployee(tobaccoName, city)) { }
                jobs.map(j => c.setAutoJobAssignment(tobaccoName, city, j, 0));
                let empch = Math.floor((3 / 15) * o.size)
                let empcl = Math.floor((2 / 15) * o.size)
                c.setAutoJobAssignment(tobaccoName, city, jobs[0], empch)
                c.setAutoJobAssignment(tobaccoName, city, jobs[1], empch)
                c.setAutoJobAssignment(tobaccoName, city, jobs[2], empcl)
                c.setAutoJobAssignment(tobaccoName, city, jobs[3], empch)
                c.setAutoJobAssignment(tobaccoName, city, jobs[4], o.size - (3 * empch + empcl))
                
            }
        }

        async function checkProducts() {
            let div = c.getDivision(tobaccoName);
            let maxProds = getMaxProducts(tobaccoName);
            let prods = div.products.map(p => c.getProduct(tobaccoName, cities[0], p));
            let nextProd = Math.max(...prods.map(p => Number.parseInt(p.name.substring(tobaccoProductPrefix.length)))) + 1;
            await discontinueWorstProductIfFull();
            await createNewProductIfNotFull();
            SellAllProducts();

            function SellAllProducts() {
                div = c.getDivision(tobaccoName);
                prods = div.products.map(p => c.getProduct(tobaccoName, cities[0], p));
                cities.forEach(city => {
                    prods.forEach(p => {
                        let product = c.getProduct(tobaccoName, city, p.name);
                        if (product.desiredSellAmount == 0 || product.desiredSellPrice == 0) {
                            c.sellProduct(tobaccoName, city, product.name, "MAX", "MP", false);

                        }
                        if (c.hasResearched(tobaccoName, "Market-TA.II")) {
                            c.setProductMarketTA2(tobaccoName, product.name, true);
                        }
                    });
                });
            }

            async function createNewProductIfNotFull() {
                div = c.getDivision(tobaccoName);
                prods = div.products.map(p => c.getProduct(tobaccoName, cities[0], p));
                if (prods.length < maxProds && c.getCorporation().funds > 2 * 1e9) {
                    ns.print(`Devloping new product: ${tobaccoProductPrefix + nextProd.toString()}`);
                    c.makeProduct(tobaccoName, cities[0], tobaccoProductPrefix + nextProd.toString(), 1e9, 1e9);
                    await ns.sleep(10);
                }
            }

            async function discontinueWorstProductIfFull() {
                if (prods.length == maxProds && prods.filter(p => p.developmentProgress < 100).length == 0) {
                    stage[1] += 1;
                    if (stage[1] > 4) {
                        let worst = prods.reduce((p, c) => p.effectiveRating < c.effectiveRating ? p : c);
                        ns.print(`Discontinuing ${worst.name} (rating: ${worst.effectiveRating})`);
                        c.discontinueProduct(tobaccoName, worst.name);
                        await ns.sleep(10);
                        stage[1] = 0;
                    }
                    else {
                        ns.print("Products full, maturing");
                    }
                }
            }
        }
    }
    function getMaxProducts(division: string): number {
        let div = c.getDivision(division);
        let max = 0;
        max += div.makesProducts ? 3 : 0;
        max += c.hasResearched(division, "uPgrade: Capacity.I") ? 1 : 0
        max += c.hasResearched(division, "uPgrade: Capacity.II") ? 1 : 0
        return max;
    }
}
export async function teaParty(ns: NS) {
    let c = ns.corporation
    let corp = c.getCorporation();
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

