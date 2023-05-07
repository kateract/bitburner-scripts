import { NS } from '@ns'
import { compare } from 'lib/functions';
import { prepareServer } from '/prepareServer';
import { ThreadRatios } from '/ThreadRatios';
import { getRatios, maximizeRatios } from '/ratios'
import { getServerSummary, logServerSummary } from '/visualize';
import { Port } from '/ports';

export async function main(ns: NS): Promise<void> {
  const log = ns.getPortHandle(Port.DISPATCH_LOG);
  const target = ns.args[0].toString();
  const host = ns.args[1].toString();
  let hackThreads = isNaN(ns.args[2] as number) ? 0 : ns.args[2] as number;
  const messages: string[] = [];

  while (true) {
    const pids: number[] = getHackProcs(ns, host, target)
    let waiting = pids.length > 0
    // if (waiting) console.log(`start waiting for ${host} targeting ${target}`)
    while (waiting) {
      const procs = getHackProcs(ns, host, target);

      waiting = false;
      pids.forEach(p => waiting = waiting || procs.indexOf(p) >= 0)
      if (waiting) {
        await ns.sleep(1000);
      } 
      else {
        // console.log(`done waiting for ${host} targeting ${target}`)
      }
    }
    let targetInfo = ns.getServer(target);
    const hostInfo = ns.getServer(host);
    const ratios = hostInfo.purchasedByPlayer && hackThreads == 0 ? await maximizeRatios(ns, targetInfo, hostInfo, false) : getRatios(ns, targetInfo, hackThreads);
    if (ratios.hackThreads < hackThreads) {
      hackThreads = ratios.hackThreads;
    }
    if (targetInfo.moneyMax * .95 > targetInfo.moneyAvailable || targetInfo.hackDifficulty > targetInfo.minDifficulty * 1.2) {
      if (messages.length > 0) {
        for (let i = 0; i < messages.length; i++)
        {
          log.write(messages.shift() as string);
        }
      } 
      log.write(ns.sprintf("Shortfall detected on %s, re-preparing...", targetInfo.hostname));
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
      let cont = runProc(order[0].item, ratios) > 0;
      await ns.sleep(order[0].time - order[1].time)
      if (cont) cont = runProc(order[1].item, ratios) > 0;
      await ns.sleep(order[1].time - order[2].time);
      if (cont) cont = runProc(order[2].item, ratios) > 0; 
      await ns.sleep(order[2].time - order[3].time);
      if (cont) cont = runProc(order[3].item, ratios) > 0;
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
      if(!cont && hackThreads > 1) {
        log.write(`Memory Constraint Reached on ${host} targeting ${target}`)
        ns.spawn("dispatcher.js", 1, target, host, Math.ceil(hackThreads * .9).toString())
      }
    }
    else {
      ns.tprint("hack time mismatch ")
      ns.tprint("Hack Time: ", ratios.hackTime);
      ns.tprint("Grow Time: ", ratios.growTime);
      ns.tprint("Weaken Time: ", ratios.weakenTime);
      ns.exit();
    }

  }

  function runProc(index: number, ratios: ThreadRatios): number {
    switch (index) {
      case 1:
        return ns.exec("hack.js", host, Math.ceil(ratios.hackThreads), target);
      case 2:
        return ns.exec("weaken.js", host, Math.ceil(ratios.weakenHackThreads), target);
      case 3:
        return ns.exec("grow.js", host, Math.ceil(ratios.growthThreads), target);
      case 4:
        return ns.exec("weakenTwice.js", host, Math.ceil(ratios.weakenGrowthThreads), target);
      default:
        return 0;
    }
  }

  function getHackProcs(ns: NS, host: string, target: string)
  {
    const processes = ["hack.js", "weaken.js", "grow.js", "weakenTwice.js"]
    return ns.ps(host).filter(p => processes.includes(p.filename) && p.args[0] == target).map(p => p.pid);
  }
}