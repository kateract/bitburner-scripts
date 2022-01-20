import { NS, ProcessInfo, Server } from '@ns'
import { deployDispatcher, explore, isHackable, killProcesses, populateServer, compare, maximizeRatios } from '/functions'



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
  targetServers.sort((a, b) => compare(a.requiredHackingSkill, b.requiredHackingSkill, true))


  const exists = getExistingProcesses(ns, purchasedServers, targetServers);

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

  while (preparePIDs.filter(p => p > 0).length > 0) {
    const procs = ns.ps().filter(p => p.filename === "prepareServer.js").map(p => p.pid);
    for (let i = 0; i < preparePIDs.length; i++) {
      if (preparePIDs[i] === 0) {
        //do nothing
      }
      else if (procs.includes(preparePIDs[i])) {
        //do nothing
      }
      else {
        targetServers[i] = ns.getServer( targetServers[i].hostname)
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
      pe.host = ns.getServer( p.filename === "prepareServer.js" ? p.args[1] : p.args[0]);
      pe.target = ns.getServer( p.filename === "prepareServer.js" ? p.args[0] : p.args[1]);
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
  for (let i = 0; i < Math.min(purchasedServers.length, targetServers.length); i++) {
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
