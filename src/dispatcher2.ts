import { NS } from '@ns'
import { batchHWGW } from '/functions';
import { prepareServer } from '/prepareServer';
import { getRatios, maximizeRatios, maximize } from '/ratios'
import { Port } from '/ports';
import { getServerSummary } from '/visualize';

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL")
  const log = ns.getPortHandle(Port.DISPATCH_LOG);
  const target = ns.args[0].toString();
  const host = ns.args[1].toString();
  let hackThreads = isNaN(ns.args[2] as number) ? 0 : ns.args[2] as number;
  const messages: string[] = [];

  while (true) {
    const pids: number[] = []
    let waiting = true
    while (waiting) {
      const procs = getHackProcs(ns, host, target);
      waiting = false;
      pids.forEach(p => waiting = waiting || procs.indexOf(p) >= 0)
      if (waiting) {
        await ns.sleep(1000);
      }
    }
    const targetInfo = ns.getServer(target);
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
      //ns.tail();
      //printServerSummary(ns, targetInfo)
      if (hostInfo.hostname == "home"){
        await prepareServer(ns, hostInfo, targetInfo, (hostInfo.maxRam - hostInfo.ramUsed)/2 < 5000 ? (hostInfo.maxRam - hostInfo.ramUsed)/2 : 5000, false);
      }
      else {  
        await prepareServer(ns, hostInfo, targetInfo, 0, false);
      }
    }

    else  {
      const threads = Math.floor(hostInfo.maxRam/1.75);
      const batches = batchHWGW(ns, ratios, threads)
      let instance = 0;
      while (batches.length > 0) {
          ns.print(getServerSummary(ns, ns.getServer(targetInfo.hostname)));
          //ns.print(`P3 Running ${curProcessThreadsRemain} instances of ${order[curProcess].process} on ${scriptHosts[curServerIndex].hostname}`);
          if (batches[0].threads <= 0) {
            break;
          }
          ns.exec(batches[0].filename, hostInfo.hostname, batches[0].threads, targetInfo.hostname, instance++);
          if (batches.length > 1)
          {
            ns.print(`Waiting ${ns.tFormat(batches[0].time - batches[1].time)} before ${batches[1].filename.slice(0,-3)}(${batches[1].threads}).`)
            await ns.sleep(batches[0].time - batches[1].time)
          }
          else 
          {
            if (batches[0].time > 0){
              ns.print(`Waiting ${ns.tFormat(batches[0].time)} for ${batches[0].filename.slice(0,-3)}.`)
              await ns.sleep(batches[0].time);
            }
          }
          batches.shift();
          //ratios = await maximize(ns, targetInfo, threads);
          //const curThreads = ns.ps(hostInfo.hostname).reduce((p, c) => p + c.threads, 0)
          //batchHWGW(ns, ratios, threads - curThreads, batches);
      }
    }

  }
  
  function getHackProcs(ns: NS, host: string, target: string)
  {
    const processes = ["hack.js", "weaken.js", "grow.js", "weakenTwice.js"]
    return ns.ps(host).filter(p => processes.includes(p.filename) && p.args[0] == target).map(p => p.pid);
  }
}