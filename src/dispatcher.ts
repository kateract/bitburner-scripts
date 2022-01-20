import { NS } from '@ns'
import { getRatios, getServerInfo, maximizeRatios, printServerSummary } from '/functions';
import { prepareServer } from '/prepareServer';

export async function main(ns : NS) : Promise<void> {
  const host = ns.args[0].toString();
  const target = ns.args[1].toString();
  const hackThreads = isNaN(ns.args[2] as number) ? 0 : ns.args[2] as number;


  while(true) {
    const pids: number[] = []
    let waiting = true
    while (waiting) {
      const procs = ns.ps(host).map(p => p.pid);
      waiting = false;
      pids.forEach(p => waiting = waiting || procs.indexOf(p) >= 0)
      if (waiting) {
        await ns.sleep(1000);
      }
    }
    let targetInfo = getServerInfo(ns, target);
    const hostInfo = getServerInfo(ns, host);
    const ratios = hostInfo.isPurchased ? await maximizeRatios(ns, targetInfo, hostInfo, false) : getRatios(ns, target, hackThreads);
    if (targetInfo.maxMoney > targetInfo.money || targetInfo.securityLevel > targetInfo.minSecurityLevel)
    {
      ns.tprintf("Shortfall detected on %s, re-preparing...", targetInfo.hostname)
      //printServerSummary(ns, targetInfo)
      await prepareServer(ns, hostInfo, targetInfo, 0, false);
    }
    else if (ratios.hackTime < ratios.growTime && ratios.growTime < ratios.weakenTime) {
      pids.push(ns.exec("weaken.js", host, Math.ceil(ratios.weakenHackThreads), target));
      await ns.sleep(2000);
      pids.push(ns.exec("weakenTwice.js", host, Math.ceil(ratios.weakenGrowthThreads), target));
      await ns.sleep(ns.getWeakenTime(target) - 1000 - ns.getGrowTime(target));
      pids.push(ns.exec("grow.js", host, Math.ceil(ratios.growthThreads), target));
      await ns.sleep(ns.getGrowTime(target) - 2000 - ns.getHackTime(target));
      pids.push(ns.exec("hack.js",host , ratios.hackThreads, target));
      await ns.sleep(ns.getHackTime(target));
      await ns.sleep(1500)
      targetInfo = getServerInfo(ns, targetInfo.hostname);
      if(targetInfo.securityLevel > targetInfo.minSecurityLevel){
        ns.tprintf("Hack Weaken not strong enough:")
        printServerSummary(ns, targetInfo)
      }
      await ns.sleep(2000)
      targetInfo = getServerInfo(ns, targetInfo.hostname);
      if(targetInfo.securityLevel > targetInfo.minSecurityLevel || targetInfo.maxMoney > targetInfo.money)
      {
        ns.tprintf("Grow Weaken or Grow amount not enough:");
        printServerSummary(ns, targetInfo)
      }

    }
    else {
      ns.tprint("hack time mismatch")
      ns.tprint("Hack Time: ", ratios.hackTime);
      ns.tprint("Grow Time: ", ratios.growTime);
      ns.tprint("Weaken Time: ", ratios.weakenTime);
      ns.exit();
    }

  }
}