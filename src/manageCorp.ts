import { CorpEmployeePosition, CorpIndustryName, CorpMaterialName, NS } from '@ns'
import { checkProducts } from './corp';


export async function main(ns: NS) {
    ns.disableLog('sleep');
    ns.clearLog();
    ns.tail();
    const c = ns.corporation

    let companyName = "KatCorp";
    let agricultureName = "Katiculture";
    const tobaccoName = "Katobacco";
    const waterName = "Katwater";
    const chemName = "Katchem"
    const tobaccoProductPrefix = "DeathSticksV";
    const restName = "Katdonalds"
    const restPrefix = "Katdonalds#"
    const stage = [0, 0]
    const prefixes: Map<string, string> = new Map<string, string>([[tobaccoName, tobaccoProductPrefix], [restName, restPrefix]])

    const stages: CorpStage[] = [
        { description: "Initial Purchases", action: startUp, parameter: 0 },
        { description: "Waiting for the employers stats to rise", action: waitForTheLazyFucksToGetTheirShitTogether },
        { description: "Buying first production multiplier material batch", action: purchaseMaterials, parameter: 0 },
        //{ description: "Expand Springwater", action: expandSpringWater },
        { description: "Accepting the first investment offer", action: invest, parameter: 1 },
        { description: "Further Upgrades", action: upgradeStuff },
        { description: "Waiting for the employers stats to rise for the second time", action: waitForTheLazyFucksToGetTheirShitTogether },
        { description: "Buying second production multiplier material batch", action: purchaseMaterials, parameter: 1 },
        { description: "Reassign employees", action: reAssignEmployees },
        { description: "Accepting the second investor offer", action: invest, parameter: 2 },
        { description: "Last Agriculture upgrades", action: lastAGUpgrades },
        { description: "Buying third production multiplier material batch", action: purchaseMaterials, parameter: 2 },
        { description: "Expand to Tobacco", action: expandToTobacco },
        { description: "Expand to Chemicals", action: expandChemicals },
        { description: "Expand to Restaurant", action: expandToRestaraunt },
        { description: "Spawn Corp Script", action: spawnCorp },
    ]

    const CityName = ns.enums.CityName;
    const states = ['START', 'PURCHASE', 'PRODUCTION', 'EXPORT', 'SALE'];
    const first = [false, false, false, false, false]
    const jobs: CorpEmployeePosition[] = ["Operations", "Engineer", "Business", "Management", "Research & Development", "Intern", "Unassigned"];
    const cities = [CityName.Aevum, CityName.Chongqing, CityName.NewTokyo, CityName.Ishima, CityName.Volhaven, CityName.Sector12];
    const fundingTargets = [0, 210000000000, 5000000000000]
    const constants = c.getConstants();
    const prodStages: number[] = [];
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
    const prodStage = stages.findIndex(s => s.description == "Expand to Tobacco");

    while (stage[0] >= 0) {
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
        if (stage[0] >= prodStage) {
            const prods = c.getCorporation().divisions.map(d => c.getDivision(d)).filter(d => d.makesProducts)
            while (prodStages.length < prods.length) { prodStages.push(0) }


            for (let i = 0; i < prods.length; i++) {
                const product = prods[i];
                const prefix = prefixes.get(product.name)
                if (prefix) {
                    prodStages[i] = await checkProducts(ns, product.name, prefix, prodStages[i])
                }
            }
        }
        first.fill(false);
    }

    //Buying tea and throwing parties to those offices that needs them
    async function teaParty() {
        const corp = c.getCorporation();
        for (const divisionName of corp.divisions) {
            const division = c.getDivision(divisionName)
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

    type CorpStage = {
        description: string;
        action: (key: number) => Promise<void>;
        parameter?: number;
    }



    async function checkStage() {
        if (stage[1] == 0) ns.print(stages[stage[0]].description)
        await stages[stage[0]].action(stages[stage[0]].parameter ?? 0)
        return;
    }
    async function spawnCorp(key: number) {
        ns.spawn("corp.js");
    }

    async function startUp(_?: number) {
        if (!c.hasCorporation()) {
            const created = ns.getResetInfo().currentNode == 3 ? c.createCorporation(companyName, false) : c.createCorporation(companyName, true)
            if (!created) return;
        }
        const corp = c.getCorporation();
        companyName = corp.name;
        let ag = corp.divisions?.map(d => c.getDivision(d)).find(f => f.type == "Agriculture")
        const agdata = c.getIndustryData("Agriculture");
        if (!ag && agdata.startingCost < c.getCorporation().funds) {
            c.expandIndustry("Agriculture", agricultureName)

            ag = c.getDivision(agricultureName);
        }
        if (!ag) return;
        agricultureName = ag.name;
        if (stage[0] == 0) {
            if (!c.hasUnlock("Smart Supply") && c.getUnlockCost("Smart Supply") < c.getCorporation().funds) {
                c.purchaseUnlock("Smart Supply");
            }
            if (!c.hasUnlock("Smart Supply")) return;

            for (const city of cities) {

                if (!ag.cities.find(c => c == city) && constants.officeInitialCost < c.getCorporation().funds) {
                    c.expandCity(ag.name, city)
                }
                const office = c.getOffice(agricultureName, city);
                if (!office) return;
                if (!c.hasWarehouse(agricultureName, city) && c.getCorporation().funds > constants.warehouseInitialCost) {
                    c.purchaseWarehouse(agricultureName, city);
                }
                c.setSmartSupply(agricultureName, city, true)
                while (office.numEmployees < 3 && c.hireEmployee(agricultureName, city)) { await ns.sleep(0) }
                for (let i = 0; i < 3; i++) {
                    if (office.employeeJobs[jobs[i]] < 1)
                        c.setAutoJobAssignment(agricultureName, city, jobs[i], 1);
                }
                if (c.getMaterial(agricultureName, city, "Plants").desiredSellAmount != 'MAX') c.sellMaterial(agricultureName, city, "Plants", "MAX", "MP")
                if (c.getMaterial(agricultureName, city, "Food").desiredSellAmount != 'MAX') c.sellMaterial(agricultureName, city, "Food", "MAX", "MP")
                while (c.getWarehouse(agricultureName, city).level < 3) {
                    c.upgradeWarehouse(agricultureName, city);
                }
                for (let index = 1; index < 6; index++) {
                    while (c.getUpgradeLevel(levelUpgrades[index]) < 2)
                        c.levelUpgrade(levelUpgrades[index]);
                }
            }
            if (c.getHireAdVertCount(agricultureName) == 0) c.hireAdVert(agricultureName);
            stage[0] += 1
            stage[1] = 0
        }
    }

    async function waitForTheLazyFucksToGetTheirShitTogether(key?: number) {
        const avgs = [0, 0];
        for (const city of cities) {
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
        for (const city of cities) {
            for (let i = 0; i < 4; i++) {
                const m = c.getMaterial(agricultureName, city, boostMaterials[i]);
                if (m.stored < materialPhases[phase][i] && c.getCorporation().funds > (materialPhases[phase][i] - m.stored) * m.marketPrice) {
                    ns.print(`Buying ${materialPhases[phase][i] - m.stored} ${boostMaterials[i]} for ${city}`);
                    c.bulkPurchase(agricultureName, city, boostMaterials[i], Math.max(materialPhases[phase][i] - m.stored, 0));
                }
            }
        }
        if (boostMaterials.every((m, i) => cities.every(city => c.getMaterial(agricultureName, city, m).stored >= materialPhases[phase][i]))) {
            stage[0] += 1;
            stage[1] = 0;
        }
        else {
            stage[1] += 1;
        }
    }

    async function expandSpringWater(key?: number) {
        await expandMaterialDivision("Spring Water", waterName, [{ division: agricultureName, material: "Water" }])
    }

    async function expandChemicals(key?: number) {
        await expandMaterialDivision("Chemical", chemName, [{ division: agricultureName, material: "Chemicals" }])
        if (c.getCorporation().divisions.includes(chemName)) {
            await addExport(agricultureName, { division: chemName, material: "Plants" })
            await addExport(chemName, { division: agricultureName, material: "Chemicals" })
        }
    }

    async function addExport(fromDivision: string, material: ExportMaterial) {
        cities.forEach(city => {
            if (c.hasWarehouse(fromDivision, city) && c.hasWarehouse(material.division, city) && !c.getMaterial(fromDivision, city, material.material).exports.find(x => x.city == city && x.division == material.division)) {
                c.exportMaterial(fromDivision, city, material.division, city, material.material, "-IPROD");
            }
        })
    }

    type ExportMaterial = { material: CorpMaterialName, division: string }

    async function expandMaterialDivision(divType: CorpIndustryName, divisionName: string, exportMaterials: ExportMaterial[]) {

        if (!c.hasUnlock("Export") && c.getUnlockCost("Export") < c.getCorporation().funds) {
            c.purchaseUnlock("Export")
        }
        let corp = c.getCorporation();
        let div = corp.divisions?.map(d => c.getDivision(d)).find(f => f.type == divType)
        const industryData = c.getIndustryData(divType);
        if (!div && industryData.startingCost < c.getCorporation().funds) {
            c.expandIndustry(divType, divisionName)

            div = c.getDivision(divisionName);
        }
        if (div) {
            for (const city of cities) {

                if (!div.cities.find(c => c == city) && constants.officeInitialCost < c.getCorporation().funds) {
                    c.expandCity(div.name, city)
                }
                if (!c.getDivision(divisionName).cities.includes(city)) continue;
                const office = c.getOffice(divisionName, city);
                if (!office) continue;
                if (!c.hasWarehouse(divisionName, city) && c.getCorporation().funds > constants.warehouseInitialCost) {
                    c.purchaseWarehouse(divisionName, city);
                }

                while (office.numEmployees < 3 && c.hireEmployee(divisionName, city)) { await ns.sleep(0) }
                for (let i = 0; i < 3; i++) {
                    if (office.employeeJobs[jobs[i]] < 1)
                        c.setAutoJobAssignment(divisionName, city, jobs[i], 1);
                }
                if (c.hasWarehouse(divisionName, city)) {
                    c.setSmartSupply(divisionName, city, true)
                    exportMaterials.forEach(m => {
                        c.sellMaterial(divisionName, city, m.material, "MAX", "MP")
                    });
                    while (c.getWarehouse(divisionName, city).level < 3 && c.getUpgradeWarehouseCost(divisionName, city) < c.getCorporation().funds) {
                        c.upgradeWarehouse(divisionName, city);
                    }

                    if (c.hasUnlock("Export")) {
                        exportMaterials.forEach(m => {
                            addExport(divisionName, m);
                        })
                    }
                }
            }
        }
        corp = c.getCorporation()
        if (corp.divisions.find(d => d == divisionName) && c.hasUnlock("Export")) {
            div = c.getDivision(divisionName);
            console.log(div);

            if (cities.every(city => div?.cities.includes(city)) && cities.every(city => c.hasWarehouse(divisionName, city)) && cities.map(city => c.getWarehouse(divisionName, city).level).every(wlevel => wlevel >= 3) && div) {
                stage[0] += 1;
                stage[1] = 0;
                return
            }
        }
        stage[1] += 1;



    }

    async function invest(i: number) {
        const corp = c.getCorporation();
        const ratio = Math.round(100 * corp.numShares / corp.totalShares)
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

        const offerMoney = c.getInvestmentOffer().funds
        if ((stage[1] <= 5 || fundingTargets[i] > (offerMoney + c.getCorporation().funds)) && stage[1] < 75) {
            ns.print(`waiting cycles: ${stage[1]}/5. investors are currently offering: $${ns.formatNumber(offerMoney)}(targeting ${ns.formatNumber(fundingTargets[i])})`);
            stage[1] += 1;
        }
        else {
            corp
            ns.tprint("investment offer round " + i + ": " + ns.formatNumber(c.getInvestmentOffer().funds))
            c.acceptInvestmentOffer();
            stage[0] += 1;
            stage[1] = 0;
        }
    }


    async function upgradeStuff(key?: number) {
        for (let i = c.getUpgradeLevel(levelUpgrades[0]); i < 10; i++) {
            if (c.getCorporation().funds > c.getUpgradeLevelCost(levelUpgrades[0]))
                c.levelUpgrade(levelUpgrades[0]);
        }
        for (let i = c.getUpgradeLevel(levelUpgrades[1]); i < 10; i++) {
            if (c.getCorporation().funds > c.getUpgradeLevelCost(levelUpgrades[1]))
                c.levelUpgrade(levelUpgrades[1]);
        }

        for (const city of cities) {
            for (let i = 0; i < 2; i++) {
                if (c.getOffice(agricultureName, city).size < 9 && c.getOfficeSizeUpgradeCost(agricultureName, city, 3) < c.getCorporation().funds) {
                    c.upgradeOfficeSize(agricultureName, city, 3);
                    while (c.hireEmployee(agricultureName, city)) { await ns.sleep(0) }
                    if (c.getOffice(agricultureName, city).size >= 9) {
                        c.setAutoJobAssignment(agricultureName, city, jobs[0], 1)
                        c.setAutoJobAssignment(agricultureName, city, jobs[1], 1)
                        c.setAutoJobAssignment(agricultureName, city, jobs[2], 1)
                        c.setAutoJobAssignment(agricultureName, city, jobs[3], 1)
                        c.setAutoJobAssignment(agricultureName, city, jobs[4], 5)
                    }
                }
            }
        }

        for (let i = 0; i < 7; i++) {
            for (const city of cities) {
                while (c.getWarehouse(agricultureName, city).level < 11 && c.getCorporation().funds > c.getUpgradeWarehouseCost(agricultureName, city, 1)) {
                    c.upgradeWarehouse(agricultureName, city, 1);
                }
            }

        }
        if (
            c.getUpgradeLevel(levelUpgrades[0]) == 10 &&
            c.getUpgradeLevel(levelUpgrades[1]) == 10 &&
            cities.every(city => c.getOffice(agricultureName, city).size >= 9 && c.getWarehouse(agricultureName, city).level >= 11)
        ) {
            stage[0] += 1;
            stage[1] = 0;
        } else {
            stage[1] += 1;
        }
    }

    async function lastAGUpgrades(key?: number) {
        let complete = 0;
        for (const city of cities) {
            for (let i = c.getWarehouse(agricultureName, city).level; i < 19; i++) {
                if (c.getCorporation().funds > c.getUpgradeWarehouseCost(agricultureName, city))
                    c.upgradeWarehouse(agricultureName, city)
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

    async function reAssignEmployees(key?: number) {
        for (const city of cities) {
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
        await expandProductDivision("Tobacco", tobaccoName, tobaccoProductPrefix)
        await addExport(agricultureName, { division: tobaccoName, material: "Plants" })
    }

    async function expandToRestaraunt() {
        await expandProductDivision("Restaurant", restName, restPrefix)
    }

    async function expandProductDivision(divisionType: CorpIndustryName, divisionName: string, productPrefix: string) {
        const corp = c.getCorporation();
        const divisions = corp.divisions.map(d => c.getDivision(d))

        if (!divisions.find(d => d.type == divisionType)) {
            try { c.expandIndustry(divisionType, divisionName); } catch { ns.tprint("Couldn't expand.. no money"); ns.exit(); }
        }
        const div = divisions.find(d => d.type == divisionType);
        if (!div) return;
        divisionName = div.name;
        if (!div.cities.find(c => c == cities[0])) {
            c.expandCity(divisionName, cities[0]);
        }
        if (!c.hasWarehouse(divisionName, cities[0])) {
            c.purchaseWarehouse(divisionName, cities[0]);
        }
        try {
            const o = c.getOffice(divisionName, cities[0]);
            for (let i = o.size / 3; i < 10; i++) {
                c.upgradeOfficeSize(divisionName, cities[0], 3);
            }
            while (c.hireEmployee(divisionName, cities[0])) { await ns.sleep(0) }
            c.setAutoJobAssignment(divisionName, cities[0], jobs[0], Math.floor(c.getOffice(divisionName, cities[0]).size / 5))
            c.setAutoJobAssignment(divisionName, cities[0], jobs[1], Math.floor(c.getOffice(divisionName, cities[0]).size / 5))
            c.setAutoJobAssignment(divisionName, cities[0], jobs[2], Math.floor(c.getOffice(divisionName, cities[0]).size / 5))
            c.setAutoJobAssignment(divisionName, cities[0], jobs[3], Math.ceil(c.getOffice(divisionName, cities[0]).size / 5))
            c.setAutoJobAssignment(divisionName, cities[0], jobs[4], Math.ceil(c.getOffice(divisionName, cities[0]).size / 5))
        } catch { ns.print("error assigning jobs") }

        //ns.print('check cities')
        for (const city of cities) {
            if (city == cities[0]) continue;
            try {
                if (!div.cities.find(c => c == city)) {
                    ns.print(`Expanding ${divisionName} to ${city}`)
                    c.expandCity(divisionName, city);
                }


                if (!c.hasWarehouse(divisionName, city))
                    c.purchaseWarehouse(divisionName, city);
            } catch { ns.print("error 401") }
            const o = c.getOffice(divisionName, city);
            for (let i = o.size / 3; i < 3; i++) {
                c.upgradeOfficeSize(divisionName, city, 3);
            }
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

        if (c.getDivision(divisionName).products.length == 0) {
            c.makeProduct(divisionName, cities[0], productPrefix + "1", 1e9, 1e9);
        }

        while (c.getCorporation().funds > c.getUpgradeLevelCost(levelUpgrades[6])) {
            ns.print(`Buying ${levelUpgrades[6]} ${c.getUpgradeLevel(levelUpgrades[6]) + 1}`);
            c.levelUpgrade(levelUpgrades[6]);
        }

        try {
            for (let i = c.getUpgradeLevel("DreamSense"); i < 10; i++) {
                c.levelUpgrade("DreamSense");
            }
        } catch { ns.print("error 431") }

        try {
            for (let i = 2; i < 6; i++) {
                while (c.getUpgradeLevel(levelUpgrades[i]) < 20) {
                    c.levelUpgrade(levelUpgrades[i]);
                }
            }
        } catch { ns.print("error 439") }

        try {
            for (let i = c.getUpgradeLevel("Project Insight"); i < 10; i++) {
                c.levelUpgrade("Project Insight");
            }
        } catch { ns.print("error 445") }

        if (
            c.getUpgradeLevel("Project Insight") >= 10 &&
            levelUpgrades.slice(2, 6).map(u => c.getUpgradeLevel(u)).reduce((prev, curr) => prev < curr ? prev : curr) >= 20 &&
            c.getUpgradeLevel("DreamSense") >= 10 &&
            c.getOffice(divisionName, cities[0]).size >= 30 &&
            c.getDivision(divisionName).cities.length == 6
        ) {
            console.log(
                divisionName,
                c.getUpgradeLevel("Project Insight"),
                levelUpgrades.slice(2, 6).map(u => c.getUpgradeLevel(u)).reduce((prev, curr) => prev < curr ? prev : curr),
                levelUpgrades.slice(2, 6).map(u => c.getUpgradeLevel(u)),
                c.getUpgradeLevel("DreamSense"),
                c.getOffice(divisionName, cities[0]).size,
                c.getDivision(divisionName).cities.length
            )
            stage[0] += 1;
            stage[1] = 0;
        } else {
            console.log(
                c.getUpgradeLevel("Project Insight"),
                levelUpgrades.slice(2, 6).map(u => c.getUpgradeLevel(u)).reduce((prev, curr) => prev < curr ? prev : curr),
                levelUpgrades.slice(2, 6).map(u => c.getUpgradeLevel(u)),
                c.getUpgradeLevel("DreamSense"),
                c.getOffice(divisionName, cities[0]).size,
                c.getDivision(divisionName).cities.length
            )
            stage[1] += 1;
        }
    }

    async function waitForCash(amount: number) {
        stage[1] += 1;
        if (c.getCorporation().funds > amount) {
            stage[0] += 1;
            stage[1] = 0;
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