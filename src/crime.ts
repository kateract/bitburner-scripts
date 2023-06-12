import { CrimeType, CrimeStats, NS } from '@ns';

export class CrimeStatsObj {
    /**
     *
     */
    constructor(ns: NS, public name: CrimeType) {
        this.stats = ns.singularity.getCrimeStats(name)
        this.chance = ns.singularity.getCrimeChance(name);
        this.expectedValue = this.stats.money * this.chance / this.stats.time;
    }
    public stats: CrimeStats;
    public chance: number;
    public expectedValue: number;
}
export async function main(ns: NS) {
    ns.disableLog("sleep")
    ns.clearLog();
    ns.tail();
    let x = 1
    while (x > 0) {
        ns.clearLog();
        let time = 100
        const crimes = Object.values(ns.enums.CrimeType)
        const crimestats = crimes.map(crime => new CrimeStatsObj(ns, crime));
        crimestats.sort((prev, curr) => curr.expectedValue - prev.expectedValue)
        crimestats.map(crime => ns.print(`${crime.name} - ${ns.formatNumber(crime.expectedValue)}(${ns.formatPercent(crime.chance)})`))
        const bestCrime = crimestats[0]
        time = bestCrime.stats.time;
        if (!ns.singularity.isBusy() || ns.singularity.getCurrentWork().type != "CRIME" || ns.singularity.getCurrentWork().crimeType != bestCrime.name) {
            console.log(ns.singularity.getCurrentWork());
            time = ns.singularity.commitCrime(bestCrime.name, ns.singularity.isFocused())
        }
        await ns.sleep(time);
        x += 1;
    }
}
