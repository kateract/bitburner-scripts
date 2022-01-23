import { NS } from '@ns'
import { compare } from '/lib/functions';
import { prepareServer } from 'tools/prepareServer';
import { ThreadRatios } from '/lib/ThreadRatios';
import { getRatios, maximizeRatios } from 'tools/ratios'

export async function main(ns: NS): Promise<void> {
  const target = ns.args[0].toString();
  const host = ns.args[1].toString();
  const hackThreads = isNaN(ns.args[2] as number) ? 0 : ns.args[2] as number;


  while (true) {
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
    let targetInfo = ns.getServer(target);
    const hostInfo = ns.getServer(host);
    const ratios = hostInfo.purchasedByPlayer && hackThreads == 0 ? await maximizeRatios(ns, targetInfo, hostInfo, false) : getRatios(ns, target, hackThreads);
    if (targetInfo.moneyMax > targetInfo.moneyAvailable || targetInfo.hackDifficulty > targetInfo.minDifficulty) {
      ns.tprintf("Shortfall detected on %s, re-preparing...", targetInfo.hostname)
      //printServerSummary(ns, targetInfo)
      await prepareServer(ns, hostInfo, targetInfo, 0, false);
    }

    else if (ratios.hackTime < ratios.growTime && ratios.growTime < ratios.weakenTime) {

      const timing = [
        { item: 1, time: ratios.hackTime + 4000 },
        { item: 2, time: ratios.weakenTime + 3000 },
        { item: 3, time: ratios.growTime + 2000 },
        { item: 4, time: ratios.weakenTime + 1000 }];

      const order = timing.sort((a, b) => compare(a.time, b.time, true));
      ns.print(order);

      runProc(order[0].item, ratios);
      await ns.sleep(order[0].time - order[1].time)
      runProc(order[1].item, ratios);
      await ns.sleep(order[1].time - order[2].time);
      runProc(order[2].item, ratios);
      await ns.sleep(order[2].time - order[3].time);
      runProc(order[3].item, ratios);
      await ns.sleep(order[3].time);

      targetInfo = ns.getServer(targetInfo.hostname);

    }
    else {
      ns.tprint("hack time mismatch")
      ns.tprint("Hack Time: ", ratios.hackTime);
      ns.tprint("Grow Time: ", ratios.growTime);
      ns.tprint("Weaken Time: ", ratios.weakenTime);
      ns.exit();
    }

  }

  function runProc(index: number, ratios: ThreadRatios) {
    switch (index) {
      case 1:
        ns.exec("hack.js", host, ratios.hackThreads, target);
        break;
      case 2:
        ns.exec("weaken.js", host, Math.ceil(ratios.weakenHackThreads), target);
        break;
      case 3:
        ns.exec("grow.js", host, Math.ceil(ratios.growthThreads), target);
        break;
      case 4:
        ns.exec("weakenTwice.js", host, Math.ceil(ratios.weakenGrowthThreads), target);
        break;
    }
  }
}