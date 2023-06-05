import { CorpEmployeePosition, CorpIndustryName, NS } from '@ns'

export async function main(ns: NS) {
    ns.disableLog('sleep');
    ns.clearLog();
    ns.tail();

    let companyName = "KatCorp";
    let agricultureName = "Katiculture";
    let tobaccoName = "Katobacco";
    let tobaccoProductPrefix = "DeathSticksV";
    const CityName = ns.enums.CityName;
    let states = ['START', 'PURCHASE', 'PRODUCTION', 'EXPORT', 'SALE'];
    let first = [false, false, false, false, false]
    const jobs: CorpEmployeePosition[] = ["Operations", "Engineer", "Business", "Management", "Research & Development", "Intern", "Unassigned"];
    const cities = [CityName.Aevum, CityName.Chongqing, CityName.NewTokyo, CityName.Ishima, CityName.Volhaven, CityName.Sector12];
    let c = ns.corporation
    const constants = c.getConstants();
    let stage = [0, 0]

    const materialPhases = [
        [125, 0, 75, 27000],
        [2800, 96, 2520, 146400],
        [9300, 726, 6720, 230400]
    ];
    const boostMaterials = ["Hardware", "Robots", "AI Cores", "Real Estate"];

    const levelUpgrades = ["Smart Factories", "Smart Storage", "FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants", "Wilson Analytics"]
    //if (stage[0] == 0) {
    await startUp();
    //}


    while (true) {
        while (c.getCorporation().state == states[0]) {
            if (!first[0]) {
                first[0] = true;
                //ns.print('START')
            }
            await ns.sleep(10);
        }

        while (c.getCorporation().state != states[0]) {
            await ns.sleep(10);
        }

        await teaParty();
        await checkStage();
        for (let i = 0; i < first.length; i++) {
            first[i] = false;
        }
    }

    //Buying tea and throwing parties to those offices that needs them
    async function teaParty() {
        let corp = c.getCorporation();
        for (const divisionName of corp.divisions) {
            var division = c.getDivision(divisionName)
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

    async function checkStage() {
        switch (stage[0]) {
            case 0:
                ns.print("Initial purchases")
                await startUp(); // stage 0
                break;
            case 1:
                if (stage[1] == 0) ns.print("Waiting for the employers stats to rise")
                await waitForTheLazyFucksToGetTheirShitTogether(); // stage 1
                break;
            case 2:
                if (stage[1] == 0) ns.print("Buying first production multiplier material batch")
                await purchaseMaterials(0); // stage 2
                break;
            case 3:
                if (stage[1] == 0) ns.print("Accepting the first investor offer");
                await invest(1); // stage 3
                break;
            case 4:
                ns.print("Further upgrades")
                await upgradeStuff(); // stage 4
                break;
            case 5:
                if (stage[1] == 0) ns.print("Waiting for the employers stats to rise for the second time")
                await waitForTheLazyFucksToGetTheirShitTogether(); // stage 5
                break;
            case 6:
                if (stage[1] == 0) ns.print("Buying second production multiplier material batch")
                await purchaseMaterials(1); // stage 6
                break;
            case 7:
                if (stage[1] == 0) ns.print("Reassign employees")
                await reAssignEmployees(); // stage 7
                break;
            case 8:
                if (stage[1] == 0) ns.print("Accepting the second investor offer");
                await invest(2); // stage 8
                break;
            case 9:
                ns.print("Last Agriculture upgrades")
                await lastAGUpgrades(); // stage 9
                break;
            case 10:
                if (stage[1] == 0) ns.print("Buying third production multiplier material batch")
                await purchaseMaterials(2); // stage 10
                break;
            case 11:
                //if (stage[1] == 0) ns.print("Expand to tobacco");
                await expandToTobacco(); // stage 11
                break;
            case 12:
            // enter the main corp script below or remove/comment out ns.spawn if you don't have one
            ns.spawn("corp.js");
        }
    }

    async function startUp() {
        if (!c.hasCorporation()) {
            var created = c.createCorporation(companyName, false) || c.createCorporation(companyName, true)
            if (!created) return;
        }
        var corp = c.getCorporation();
        companyName = corp.name;
        var ag = corp.divisions?.map(d => c.getDivision(d)).find(f => f.type == "Agriculture")
        var agdata = c.getIndustryData("Agriculture");
        if (!ag && agdata.startingCost < ns.getServerMoneyAvailable('home')) {
            c.expandIndustry("Agriculture", agricultureName)
            ag = c.getDivision(agricultureName);
        }
        if (!ag) return;
        agricultureName = ag.name;
        if (stage[0] == 0) {
            if (!c.hasUnlock("Smart Supply") && c.getUnlockCost("Smart Supply") < ns.getServerMoneyAvailable('home')) {
                c.purchaseUnlock("Smart Supply");
            }
            if (!c.hasUnlock("Smart Supply")) return;
            for (let city of cities) {
                if (!ag.cities.find(c => c == city) && constants.officeInitialCost < ns.getServerMoneyAvailable('home')) {
                    c.expandCity(ag.name, city)
                }
                let office = c.getOffice(agricultureName, city);
                if (!office) return;
                c.setSmartSupply(agricultureName, city, true)
                while (office.numEmployees < 3 && c.hireEmployee(agricultureName, city)) { }
                for (let i = 0; i < 3; i++) {
                    if (office.employeeJobs[jobs[i]] < 1)
                        c.setAutoJobAssignment(agricultureName, city, jobs[i], 1);
                }
                c.sellMaterial(agricultureName, city, "Plants", "MAX", "MP")
                c.sellMaterial(agricultureName, city, "Food", "MAX", "MP")

            }

            stage[0] += 1
            stage[1] = 0
        }
    }

    async function waitForTheLazyFucksToGetTheirShitTogether() {
        let avgs = [0, 0];
        for (let city of cities) {
            avgs[0] += c.getOffice(agricultureName, city).avgMorale
            avgs[1] += c.getOffice(agricultureName, city).avgEnergy
        }
        ns.clearLog();
        ns.print("waiting for employee stats to rise");
        ns.print("   avg morale: " + (avgs[0] / 6).toFixed(3) + "/97")
        ns.print("   avg energy: " + (avgs[1] / 6).toFixed(3) + "/97")
        stage[1]++;
        if (avgs[0] / 6 >= 97 && avgs[1] / 6 >= 97 && stage[1] > 0) { stage[0] += 1; stage[1] = 0; }

    }



    async function purchaseMaterials(phase: number) {

        for (let city of cities) {
            for (let i = 0; i < 4; i++) {
                let m = c.getMaterial(agricultureName, city, boostMaterials[i]);
                if (m.stored < materialPhases[phase][i]) {
                    ns.print(`Buying ${materialPhases[phase][i] - m.stored} ${boostMaterials[i]} for ${city}`);
                    c.bulkPurchase(agricultureName, city, boostMaterials[i], Math.max(materialPhases[phase][i] - m.stored, 0));
                }
            }
        }
        stage[0] += 1;
        stage[1] = 0;
    }

    async function invest(i: number) {
        let corp = c.getCorporation();
        let ratio = Math.round(100 * corp.numShares / corp.totalShares)
        ns.print(`Ratio: ${ratio}`);
        if ((ratio < 100 && i == 1) || (ratio < 90 && i == 2) || (ratio < 55 && i == 3) || (ratio < 70 && i == 4)) {
            ns.print(`Funding round ${i} already complete, skipping.`)
            stage[0] += 1;
            stage[1] = 0;
            return;
        }


        if (stage[1] == 0) {
            ns.print("waiting for a bit, just in case the investors might give a bit more money")
        }
        // investor evaluation takes into account 5 cycles 
        // and we want them to take into account the current high earning cycles,
        // not the old low earning cycles, so we'll wait for a bit.


        if (stage[1] <= 5) {
            ns.print("waiting cycles: " + stage[1] + "/5. investors are currently offering: " + ns.nFormat(c.getInvestmentOffer().funds, "0.00a"));
            stage[1] += 1;
        }
        else {
            corp
            ns.tprint("investment offer round " + i + ": " + ns.nFormat(c.getInvestmentOffer().funds, "0.00a"))
            c.acceptInvestmentOffer();
            stage[0] += 1;
            stage[1] = 0;
        }
    }


    async function upgradeStuff() {
        let complete = 0
        for (let i = c.getUpgradeLevel(levelUpgrades[0]); i < 10; i++) {
            try { c.levelUpgrade(levelUpgrades[0]) } catch { };
        }
        complete = c.getUpgradeLevel(levelUpgrades[0]) == 10 ? 1 : 0;
        for (let i = c.getUpgradeLevel(levelUpgrades[1]); i < 10; i++) {
            try { c.levelUpgrade(levelUpgrades[1]) } catch { };
        }
        complete = c.getUpgradeLevel(levelUpgrades[1]) == 10 ? 1 : 0;

        for (let i = 0; i < 2; i++) {
            for (let city of cities) {
                try {
                    if (c.getOffice(agricultureName, city).size < 9) {
                        c.upgradeOfficeSize(agricultureName, city, 3);
                        while (c.hireEmployee(agricultureName, city)) { };
                        c.setAutoJobAssignment(agricultureName, city, jobs[0], 1)
                        c.setAutoJobAssignment(agricultureName, city, jobs[1], 1)
                        c.setAutoJobAssignment(agricultureName, city, jobs[2], 1)
                        c.setAutoJobAssignment(agricultureName, city, jobs[3], 1)
                        c.setAutoJobAssignment(agricultureName, city, jobs[4], 5)
                    }
                } catch { }
                complete += c.getOffice(agricultureName, city).size == 9 ? 1 : 0;
            }
        }

        for (let i = 0; i < 7; i++) {
            for (let city of cities) {
                let w = c.getWarehouse(agricultureName, city)
                if (w.level < 10) {
                    try { c.upgradeWarehouse(agricultureName, city, 1); } catch { }
                }
                complete += c.getWarehouse(agricultureName, city).level == 10 ? 1 : 0;
            }
        }
        if (complete = 14) {
            stage[0] += 1;
            stage[1] = 0;
        }
    }

    async function lastAGUpgrades() {
        let complete = 0;
        for (let city of cities) {
            for (let i = c.getWarehouse(agricultureName, city).level; i < 19; i++) {
                try { c.upgradeWarehouse(agricultureName, city, 1); } catch { }
            }
            if (c.getWarehouse(agricultureName, city).level >= 19) {
                ns.print(`${city} warehouse for ${agricultureName} at level ${c.getWarehouse(agricultureName, city).level}`)
                complete++;
            }
        }
        if (complete == 6) {
            stage[0] += 1;
            stage[1] = 0;
        }
    }

    async function reAssignEmployees() {
        for (let city of cities) {
            jobs.map(j => c.setAutoJobAssignment(agricultureName, city, j, 0));
            c.setAutoJobAssignment(agricultureName, city, jobs[0], 3)
            c.setAutoJobAssignment(agricultureName, city, jobs[1], 2)
            c.setAutoJobAssignment(agricultureName, city, jobs[2], 2)
            c.setAutoJobAssignment(agricultureName, city, jobs[3], 2)
        }
        stage[0]++;
        stage[1] = 0;
    }

    async function expandToTobacco() {
        let corp = c.getCorporation();
        let divisions = corp.divisions.map(d => c.getDivision(d))

        if (!divisions.find(d => d.type == "Tobacco")) {
            try { c.expandIndustry("Tobacco", tobaccoName); } catch { ns.tprint("Couldn't expand.. no money"); ns.exit(); }
        }
        let div = divisions.find(d => d.type == "Tobacco");
        if (!div) return;
        tobaccoName = div.name;
        if (!div.cities.find(c => c == cities[0])) {
            c.expandCity(tobaccoName, cities[0]);
        }
        let warehouse = c.getWarehouse(tobaccoName, cities[0])
        if (!warehouse)
            c.purchaseWarehouse(tobaccoName, cities[0]);
        try {
            let o = c.getOffice(tobaccoName, cities[0]);
            for (let i = o.size / 3; i < 10; i++) {
                c.upgradeOfficeSize(tobaccoName, cities[0], 3);
            }
            while (c.hireEmployee(tobaccoName, cities[0])) { }
            c.setAutoJobAssignment(tobaccoName, cities[0], jobs[0], Math.floor(c.getOffice(tobaccoName, cities[0]).size / 5))
            c.setAutoJobAssignment(tobaccoName, cities[0], jobs[1], Math.floor(c.getOffice(tobaccoName, cities[0]).size / 5))
            c.setAutoJobAssignment(tobaccoName, cities[0], jobs[2], Math.floor(c.getOffice(tobaccoName, cities[0]).size / 5))
            c.setAutoJobAssignment(tobaccoName, cities[0], jobs[3], Math.ceil(c.getOffice(tobaccoName, cities[0]).size / 5))
            c.setAutoJobAssignment(tobaccoName, cities[0], jobs[4], Math.ceil(c.getOffice(tobaccoName, cities[0]).size / 5))
        } catch { }
        //ns.print('check cities')
        for (let city of cities) {
            if (city == cities[0]) continue;
            try {
                if (!div.cities.find(c => c == city)) {
                    ns.print(`Expanding ${tobaccoName} to ${city}`)
                    c.expandCity(tobaccoName, city);
                }


                if (!c.hasWarehouse(tobaccoName, city))
                    c.purchaseWarehouse(tobaccoName, city);
            } catch { }
            let o = c.getOffice(tobaccoName, city);
            for (let i = o.size / 3; i < 3; i++) {
                c.upgradeOfficeSize(tobaccoName, city, 3);
            }
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
        //ns.print('check products')
        if (c.getDivision(tobaccoName).products.length == 0) {
            c.makeProduct(tobaccoName, cities[0], tobaccoProductPrefix + "1", 1e9, 1e9);
        }
        //ns.print(`checking for ${levelUpgrades[6]} upgrades`);
        while (c.getCorporation().funds > c.getUpgradeLevelCost(levelUpgrades[6])) {
            ns.print(`Buying ${levelUpgrades[6]} ${c.getUpgradeLevel(levelUpgrades[6]) + 1}`);
            c.levelUpgrade(levelUpgrades[6]);
        }
        //ns.print(`check Dreamsense`)
        try {
            for (let i = c.getUpgradeLevel("DreamSense"); i < 10; i++) {
                c.levelUpgrade("DreamSense");
            }
        } catch { }
        //ns.print('check other upgrades')
        try {
            for (let i = 2; i < 6; i++) {
                while (c.getUpgradeLevel(levelUpgrades[i]) < 20) {
                    c.levelUpgrade(levelUpgrades[i]);
                }
            }
        } catch { }
        //ns.print(`check Project Insight`)
        try {
            for (let i = c.getUpgradeLevel("Project Insight"); i < 10; i++) {
                c.levelUpgrade("Project Insight");
            }
        } catch { }
        //ns.print('check products') 
        div = c.getDivision(tobaccoName);
        let maxProds = getMaxProducts(tobaccoName);
        let prods = div.products.map(p => c.getProduct(tobaccoName, cities[0], p));
        let nextProd = Math.max(...prods.map(p => Number.parseInt(p.name.substring(tobaccoProductPrefix.length)))) + 1;
        //ns.print(`${prods.filter(p => p.developmentProgress < 100).length} products in development`);
        if (prods.length == maxProds && prods.filter(p => p.developmentProgress < 100).length == 0) {
            stage[1] += 1
            if (stage[1] > 4) {
                let worst = prods.reduce((p, c) => p.effectiveRating < c.effectiveRating ? p : c)
                ns.print(`Discontinuing ${worst.name} (rating: ${worst.effectiveRating})`)
                c.discontinueProduct(tobaccoName, worst.name);
                await ns.sleep(10);
                stage[1] = 0
            }
            else {
                ns.print("Products full, maturing");
            }
        }
        div = c.getDivision(tobaccoName);
        prods = div.products.map(p => c.getProduct(tobaccoName, cities[0], p));
        if (prods.length < maxProds) {
            ns.print(`Devloping new product: ${tobaccoProductPrefix + nextProd.toString()}`)
            c.makeProduct(tobaccoName, cities[0], tobaccoProductPrefix + nextProd.toString(), 1e9, 1e9)
            await ns.sleep(10);
        }
        div = c.getDivision(tobaccoName);
        prods = div.products.map(p => c.getProduct(tobaccoName, cities[0], p));
        cities.forEach(city => {
            prods.forEach(p => {
                let product = c.getProduct(tobaccoName, city, p.name)
                if (product.desiredSellAmount == 0 || product.desiredSellPrice == 0) {
                    c.sellProduct(tobaccoName, city, product.name, "MAX", "MP", false);

                }
                if (c.hasResearched(tobaccoName, "Market-TA.II")) {
                    c.setProductMarketTA2(tobaccoName, product.name, true);
                }
            })
        });

        if(
            c.getUpgradeLevel("Project Insight") >= 10 &&
            levelUpgrades.slice(2,6).map(u => c.getUpgradeLevel(u)).reduce((prev, curr) => prev < curr ? prev : curr) >= 20 &&
            c.getUpgradeLevel("DreamSense") >= 10 &&
            c.getOffice(tobaccoName, cities[0]).size >= 30 &&
            c.getDivision(tobaccoName).cities.length == 6
        ) {
            stage[0] += 1;
            stage[1] = 0;
        } else {
            console.log(
                c.getUpgradeLevel("Project Insight") >= 10,
                levelUpgrades.slice(2, 6).map(u => c.getUpgradeLevel(u)).reduce((prev, curr) => prev < curr ? prev : curr) >= 20,
                levelUpgrades.slice(2, 6).map(u => c.getUpgradeLevel(u)),
                c.getUpgradeLevel("DreamSense") >= 10,
                c.getOffice(tobaccoName, cities[0]).size >= 30,
                c.getDivision(tobaccoName).cities.length == 6
            )
        }
    }

    async function waitForCash(amount: number) {
        if (c.getCorporation().funds > amount) {
            stage[0] += 1;
            stage[1] = 0;
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