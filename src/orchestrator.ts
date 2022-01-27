import { NS, ProcessInfo, Server } from '@ns'
import { deployDispatcher, isHackable, killProcesses, populateServer, compare } from '/functions'
import { explore } from '/explore'
import { maximizeRatios } from '/ratios'



interface ProcessInfoExt extends ProcessInfo {
  host: Server;
  target: Server;
}

export async function main(ns: NS): Promise<void> {
  const scriptCost = 1.8;
  const servers = await explore(ns, "home");
  const purchasedServers = servers.filter(s => s.maxRam > scriptCost && s.purchasedByPlayer).sort((a, b) => compare(a.maxRam, b.maxRam, true));
  const threadLimits = purchasedServers.map(s => Math.floor(s.maxRam / scriptCost));
  let totalThreads = 0;
  const targetServers = servers.filter(s => isHackable(ns, s));
  targetServers.sort((a, b) => compare(a.moneyMax, b.moneyMax, true))


  const exists = getExistingProcesses(ns, purchasedServers, targetServers);
  console.log(exists);
  for (let i = 0; i < purchasedServers.length; i++) {
    ns.tprintf("Server: %s  Threads: %d  Target: %s", purchasedServers[i].hostname, threadLimits[i], targetServers[i]?.hostname);
    await populateServer(ns, purchasedServers[i]);
    totalThreads += threadLimits[i];
  }
  ns.tprintf("Total Threads available: %d", totalThreads)

  const preparePIDs: number[] = []
  // //find existing prepare PIDs
  // const existingPrepares = ns.ps("home").filter(p => p.filename ==="prepareServer.js")

  prepareServers(ns, purchasedServers, targetServers, threadLimits, exists, preparePIDs);
  //wait for a prepare thread to exit
  const primaryServers = Math.min(purchasedServers.length, targetServers.length);
  if (primaryServers < targetServers.length){ 
    const memReq = Math.max(ns.getScriptRam("prepareServer.js"), ns.getScriptRam("dispatcher.js")) * primaryServers + ns.getScriptRam("orchestrator.js") + ns.getScriptRam("watcher.js");
    const home = ns.getServer("home");
    const memFree = Math.floor((home.maxRam - memReq)/5000)
    for (let i = primaryServers; i < Math.min(primaryServers + memFree, targetServers.length); i++) {
      //ns.tprint(targetServers[i]);
      if (!exists.find(p => p.target.hostname == targetServers[i].hostname)){
        ns.exec("homeDispatch.js", "home", 1, targetServers[i].hostname);
      }
      await ns.sleep(200);
    }
  }

  while (preparePIDs.filter(p => p > 0).length > 0) {
    const procs = ns.ps().filter(p => p.filename === "prepareServer.js");
    for (let i = 0; i < preparePIDs.length; i++) {
      const newProc = procs.find(p => p.args[0] == targetServers[i].hostname && p.args[1] == purchasedServers[i].hostname)
      if (preparePIDs[i] === 0) {
        //do nothing
      }
      else if (preparePIDs[i] == newProc?.pid) {
        //do nothing
      }
      else if (newProc) {
        preparePIDs[i] = newProc.pid;
      }
      else {
        targetServers[i] = ns.getServer(targetServers[i].hostname)
        const ratio = await maximizeRatios(ns, targetServers[i], purchasedServers[i], false)
        if (ratio) {
          deployDispatcher(ns, "home", purchasedServers[i].hostname, targetServers[i].hostname, ratio);
          preparePIDs[i] = 0;
          await ns.sleep(100);
        }
      }
    }
    await ns.sleep(10000);
  }

}


function getExistingProcesses(ns: NS, purchasedServers: Server[], targetServers: Server[]): ProcessInfoExt[] {
  const exist = ns.ps()
    .filter(p => p.filename === "prepareServer.js"
      || p.filename === "dispatcher.js")
    .map(p => {
      const pe = p as ProcessInfoExt;
      pe.target = ns.getServer( p.args[0]);
      pe.host = ns.getServer( p.args[1]);
      return pe;
    })
    .filter(p => purchasedServers.map(s => s.hostname).includes(p.host.hostname));

  for (const process of exist) {
    const pIndex = purchasedServers.findIndex(s => s.hostname === process.host.hostname);
    if (targetServers[pIndex].hostname != process.target.hostname) {
      const tIndex = targetServers.findIndex(s => s.hostname === process.target.hostname);
      if (tIndex >= 0) { //server is in the target list
        targetServers[tIndex] = targetServers[pIndex];
      }
      else { //server is not in the target list, and can be improved
        ns.kill(process.pid);
        process.pid = 0
      }
    }
  }
  return exist.filter(p => p.pid > 0);
}

function prepareServers(ns: NS, purchasedServers: Server[], targetServers: Server[], threadLimits: number[], exists: ProcessInfoExt[], preparePIDs: number[]) {
  const primaryServers = Math.min(purchasedServers.length, targetServers.length);
  for (let i = 0; i < primaryServers; i++) {
    const exist = exists.find(e => e.host == purchasedServers[i])
    if (exist) {
      if (exist.filename === "prepareServer.js")
        preparePIDs.push(exist.pid);
      else 
        preparePIDs.push(0);
    }
    else {
      const target = targetServers[i];
      const host = purchasedServers[i];
      killProcesses(ns, host);
      const pid = ns.exec("prepareServer.js", "home", 1, target.hostname, host.hostname, threadLimits[i]);
      preparePIDs.push(pid ? pid : 0);
    }
  }
}
