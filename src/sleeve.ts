import { CrimeStats, CrimeType, GymType, NS, SleevePerson, SleeveCrimeTask, SleeveFactionTask, FactionWorkType, WorkStats } from '@ns';
import { getFactionRepNeeded } from './lib/augments';
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
export class SleeveFactionWorkStatsObj {
    /**
     *
     */
    constructor(ns: NS, public name: FactionWorkType, sleeve: SleevePerson, favor: number) {
        this.stats = ns.formulas.work.factionGains(sleeve, name, favor)
    }
    public stats: WorkStats;
}
export async function main(ns: NS) {
    ns.disableLog("sleep");
    ns.clearLog();
    ns.tail();

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const LocationName = ns.enums.LocationName;
        const Courses = ns.enums.UniversityClassType
        const GymType = ns.enums.GymType;


        const s = ns.sleeve;
        const sleeveCount = s.getNumSleeves();
        const factionReps = getFactionRepNeeded(ns);
        let factions: string[] = [];
        factionReps.forEach((v, k) => factions.push(k))
        if(ns.gang.inGang())
        {
            const gangFaction = ns.gang.getGangInformation().faction
            factions = factions.filter(f => f != gangFaction);
        }
        for (let i = 0; i < sleeveCount; i++) {
            const sleeve = s.getSleeve(i);
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
            else if (skills.reduce((p, c) => p < c ? p : c) >= 69) {
                if (i < factions.length) {
                    const works = Object.values(ns.enums.FactionWorkType)
                    const workstats = works.map(work => new SleeveFactionWorkStatsObj(ns, work, sleeve, ns.singularity.getFactionFavor(factions[i])))
                    workstats.sort((prev, cur) => cur.stats.reputation - prev.stats.reputation)
                    ns.print(workstats);
                    console.log(workstats);
                    if (s.getTask(i)?.type != "FACTION" || (s.getTask(i) as SleeveFactionTask).factionWorkType != workstats[0].name) {
                        s.setToFactionWork(i, factions[i], workstats[0].name)
                    }
                }
                else {
                    const crimes = Object.values(ns.enums.CrimeType)
                    const crimestats = crimes.map(crime => new SleeveCrimeStatsObj(ns, crime, sleeve))
                    crimestats.sort((prev, curr) => curr.expectedValue - prev.expectedValue)
                    const bestCrime = crimestats[0];
                    if (s.getTask(i)?.type != "CRIME" || (s.getTask(i) as SleeveCrimeTask).crimeType != bestCrime.name) {
                        s.setToCommitCrime(i, bestCrime.name);
                    }
                }
            }
            else {

                const index = skills.indexOf(Math.min(...skills))
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
                    s.setToUniversityCourse(i, LocationName.Sector12RothmanUniversity, Courses.algorithms);
                } else {
                    s.setToUniversityCourse(i, LocationName.Sector12RothmanUniversity, Courses.leadership);
                }
            }
        }
        await ns.sleep(10000);

    }
}