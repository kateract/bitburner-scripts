import { CrimeStats, CrimeType, GymType, NS, SleevePerson, SleeveCrimeTask } from '@ns';
export class SleeveCrimeStatsObj {
    /**
     *
     */
    constructor(ns: NS, public name: CrimeType, sleeve: SleevePerson) {
        this.stats = ns.singularity.getCrimeStats(name)
        this.chance = ns.formulas.work.crimeSuccessChance(sleeve, name)
        this.expectedValue = this.stats.money * this.chance / this.stats.time;
        
    }
    public stats: CrimeStats;
    public chance: number;
    public expectedValue: number;
}
export async function main(ns: NS) {
    ns.disableLog("sleep");
    ns.clearLog();
    ns.tail();
    
    while (true) {
        const LocationName = ns.enums.LocationName;
        const Courses = ns.enums.UniversityClassType
        const GymType = ns.enums.GymType;
        

        const s = ns.sleeve;
        let sleeveCount = s.getNumSleeves();

        for (let i = 0; i < sleeveCount; i++) {
            let sleeve = s.getSleeve(i);
            let skills = [sleeve.skills.agility, sleeve.skills.dexterity, sleeve.skills.strength, sleeve.skills.defense, sleeve.skills.hacking, sleeve.skills.charisma]
            skills = skills.map(s => Math.floor(s))
            if (sleeve.shock > 66) {
                if (s.getTask(i)?.type != "RECOVERY")
                    s.setToShockRecovery(i);
            }
            else if (sleeve.sync < 100) {
                if (s.getTask(i)?.type != "SYNCHRO")
                    s.setToSynchronize(i);
            }
            if (skills.reduce((p, c) => p < c ? p : c) >= 69) {
                var crimes = Object.values(ns.enums.CrimeType)
                var crimestats = crimes.map(crime => new SleeveCrimeStatsObj(ns, crime, sleeve))
                crimestats.sort((prev, curr) => curr.expectedValue - prev.expectedValue)
                var bestCrime = crimestats[0];
                if (s.getTask(i)?.type != "CRIME" || (s.getTask(i) as SleeveCrimeTask).crimeType != bestCrime.name) {
                    s.setToCommitCrime(i, bestCrime.name);
                }
            }
            else {

                let index = skills.indexOf(Math.min(...skills))
                if (index < 4) {
                    let gymtype: GymType;
                    switch (index) {
                        case 0:
                            gymtype = GymType.agility
                            break;
                        case 1:
                            gymtype = GymType.dexterity
                            break;
                        case 2:
                            gymtype = GymType.strength
                            break;
                        default:
                            gymtype = GymType.defense
                            break;
                    }
                    s.setToGymWorkout(i, LocationName.Sector12PowerhouseGym, gymtype);
                } else if (index == 4) { 
                    s.setToUniversityCourse(i, LocationName.Sector12RothmanUniversity,  Courses.algorithms);
                } else {
                    s.setToUniversityCourse(i, LocationName.Sector12RothmanUniversity, Courses.leadership);
                }
            }
        }
        await ns.sleep(10000);

    }
}