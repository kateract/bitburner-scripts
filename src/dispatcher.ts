import { NS } from '@ns'
import { compare } from '/functions';
import { prepareServer } from '/prepareServer';
import { ThreadRatios } from '/ThreadRatios';
import { getRatios, maximizeRatios } from '/ratios'
import { getServerSummary, logServerSummary } from '/visualize';

export async function main(ns: NS): Promise<void> {
  const target = ns.args[0].toString();
  const host = ns.args[1].toString();
  let hackThreads = isNaN(ns.args[2] as number) ? 0 : ns.args[2] as number;
  const messages: string[] = [];

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
    const ratios = hostInfo.purchasedByPlayer && hackThreads == 0 ? await maximizeRatios(ns, targetInfo, hostInfo, false) : getRatios(ns, targetInfo, hackThreads);
    if (ratios.hackThreads < hackThreads) {
      hackThreads = ratios.hackThreads;
    }
    if (targetInfo.moneyMax > targetInfo.moneyAvailable || targetInfo.hackDifficulty > targetInfo.minDifficulty) {
      if (messages.length > 0) {
        for (let i = 0; i < messages.length; i++)
        {
          ns.tprintf(messages.shift() as string)
        }
      } 
      ns.tprintf("Shortfall detected on %s, re-preparing...", targetInfo.hostname)
      //printServerSummary(ns, targetInfo)
      if (hostInfo.hostname == "home"){
        await prepareServer(ns, hostInfo, targetInfo, (hostInfo.maxRam - hostInfo.ramUsed)/2 < 5000 ? (hostInfo.maxRam - hostInfo.ramUsed)/2 : 5000, false);
      }
      else {  
        await prepareServer(ns, hostInfo, targetInfo, 0, false);
      }
    }

    else if (ratios.hackTime < ratios.growTime && ratios.growTime < ratios.weakenTime) {
      if (messages.length > 0) {
        for (let i = 0; i < messages.length; i++)
        {
          ns.print(messages.shift() as string)
        }
      } 
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
      await ns.sleep(ratios.hackTime+ 500);
      targetInfo = ns.getServer(targetInfo.hostname);
      messages.push(ns.sprintf("Actual Hack Amount: %s (expected %s)", ns.nFormat((targetInfo.moneyMax - targetInfo.moneyAvailable) / targetInfo.moneyMax, "0.00000"), ns.nFormat(ns.hackAnalyze(targetInfo.hostname)* ratios.hackThreads, "0.00000")));
      await ns.sleep(1000);
      targetInfo = ns.getServer(targetInfo.hostname)
      
      if (targetInfo.hackDifficulty > targetInfo.baseDifficulty) {
        messages.push(ns.sprintf("Target %s Hack weaken ineffective:", targetInfo.hostname))
        messages.push(getServerSummary(ns, targetInfo));
        ns.print(getServerSummary(ns, targetInfo));
      }
      await ns.sleep(1000)
      targetInfo = ns.getServer(targetInfo.hostname);
      if (targetInfo.moneyMax > targetInfo.moneyAvailable) {
        const shortGrowthThreads = Math.ceil(ns.growthAnalyze(targetInfo.hostname, targetInfo.moneyMax / targetInfo.moneyAvailable));
        messages.push(ns.sprintf("Target %s Grow ineffective, %d more threads required(was %d):", targetInfo.hostname, shortGrowthThreads, ratios.growthThreads));
        const gmsg = getServerSummary(ns, targetInfo)
        ns.print(gmsg);
        messages.push(gmsg);
        logServerSummary(ns, targetInfo);
      }
      await ns.sleep(1000)
      targetInfo = ns.getServer(targetInfo.hostname);
      if (targetInfo.hackDifficulty > targetInfo.baseDifficulty) {
        messages.push(ns.sprintf("Target %s Grow weaken ineffective:", targetInfo.hostname));
        messages.push(getServerSummary(ns, targetInfo));
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