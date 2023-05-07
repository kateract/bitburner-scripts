import { NS } from '@ns'
import { batchHWGW, batchPrepare } from 'lib/functions';
import { prepareServer } from '/prepareServer';
import { getRatios, maximizeRatios, maximize, getRatiosSummary } from '/ratios'
import { Port } from '/ports';
import { getServerSummary } from '/visualize';
import { ProcessTiming } from '/ProcessTiming';
import { IAutocompleteData } from '/IAutocompleteData';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data : IAutocompleteData, args : string[]) : string[] {
  return [...data.servers];
  return [...data.servers];
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL")
  const log = ns.getPortHandle(Port.DISPATCH_LOG);
  const target = ns.args[0].toString();
  const host = ns.args[1].toString();
  let hackThreads = isNaN(ns.args[2] as number) ? 0 : ns.args[2] as number;
  const messages: string[] = [];
  let batches: ProcessTiming[] = [];
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
        batches = [];
      }
    }
    const targetInfo = ns.getServer(target);
    const hostInfo = ns.getServer(host);
    const threads = Math.floor(hostInfo.maxRam / 1.8);
    const ratios = hostInfo.purchasedByPlayer && hackThreads == 0 ? await maximize(ns, targetInfo, threads, false) : getRatios(ns, targetInfo, hackThreads);
    if (ratios.hackThreads < hackThreads) {
      hackThreads = ratios.hackThreads;
    }
    if (targetInfo.moneyMax * .95 > targetInfo.moneyAvailable || targetInfo.hackDifficulty > targetInfo.minDifficulty * 1.2) {
      if (messages.length > 0) {
        for (let i = 0; i < messages.length; i++) {
          log.write(messages.shift() as string);
        }
      }
      log.write(ns.sprintf("Shortfall detected on %s(%s), re-preparing...", targetInfo.hostname, hostInfo.hostname));
      //ns.tail();
      //printServerSummary(ns, targetInfo)
      batches = batchPrepare(ns, targetInfo, threads, batches)
    }

    else {
      batches = batchHWGW(ns, ratios, threads, batches)
    }
    let instance = 0;
    let currentBatch = 0;
    // console.log(hostInfo.hostname, targetInfo.hostname, batches.length, "batches")
    while (batches.length > currentBatch) {
      ns.print(getServerSummary(ns, ns.getServer(targetInfo.hostname)));

      if (!batches[currentBatch] || batches[currentBatch].threads <= 0) {
        // console.log("batch issue", currentBatch, batches);
        break;
      }

      batches[currentBatch].pid = ns.exec(batches[currentBatch].filename, hostInfo.hostname, Math.max(Math.floor(batches[currentBatch].threads), 1), targetInfo.hostname, instance++);
      ns.print(`ran ${batches[currentBatch].filename} with ${batches[currentBatch].threads} threads for batch ${currentBatch} with PID ${batches[currentBatch].pid}`);
      
      if (batches.length > currentBatch + 1) {
        ns.print(`Waiting ${ns.tFormat(batches[currentBatch].adjustedTime - batches[currentBatch + 1].adjustedTime)} before ${batches[currentBatch + 1].filename.slice(0, -3)}(${batches[currentBatch + 1].threads}).`)
        await ns.sleep(batches[currentBatch].adjustedTime - batches[currentBatch + 1].adjustedTime)
      }
      else if (batches[currentBatch].time > 0) {
        ns.print(`Waiting ${ns.tFormat(batches[currentBatch].adjustedTime)} for ${batches[currentBatch].filename.slice(0, -3)}.`)
        await ns.sleep(batches[currentBatch].time);
      }
      else {
        console.log("no time for current batch", hostInfo.hostname, targetInfo.hostname, currentBatch, batches)
        break;
      }
      const procs = ns.ps(hostInfo.hostname);
      const deadp = batches.filter(b => b.pid > 0 && procs.findIndex(p => p.pid == b.pid) < 0)
      //if (deadp.length > 0) console.log("deads", deadp);
      const dead = deadp.map(b => b.pid);


      batches = batches.filter(b => !dead.includes(b.pid))
      currentBatch = batches.findIndex(b => b.pid == 0);
      ns.print(`next batch number: ${currentBatch}`);
      if (!batches[currentBatch] || batches[currentBatch].threads <= 0) {
        //console.log("current batch complete", hostInfo.hostname, targetInfo.hostname, currentBatch, batches);
        break;
      }
      //console.log(hostInfo.hostname, targetInfo.hostname, currentBatch, batches.length)
      //ratios = await maximize(ns, targetInfo, threads);
      //const curThreads = ns.ps(hostInfo.hostname).reduce((p, c) => p + c.threads, 0)
      //batchHWGW(ns, ratios, threads - curThreads, batches);
    }
    await ns.asleep(1000)

  }

  function getHackProcs(ns: NS, host: string, target: string) {
    const processes = ["hack.js", "weaken.js", "grow.js", "weakenTwice.js"]
    return ns.ps(host).filter(p => processes.includes(p.filename) && p.args[0] == target).map(p => p.pid);
  }
}