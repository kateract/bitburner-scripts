import { NS, Server } from '@ns'
import { printServerInfo } from '/lib/visualize'

export async function main(ns: NS): Promise<void> {
  const target = ns.getServer( ns.args[0].toString());
  let host = ns.getHostname();
  if (ns.args.length > 1) host = ns.args[1].toString();
  let threadLimit = 0
  if (ns.args.length > 2) threadLimit = ns.args[2] as number;
  let printInfo = false;
  if (ns.args.length > 3) printInfo = true;
  await prepareServer(ns, ns.getServer( host), target, threadLimit, printInfo);
}


/** @param {NS} ns **/
export async function prepareServer(ns: NS, host: Server, target: Server, threadLimit = 0, printInfo = false): Promise<void> {
  //phase one, weaken to min sec level
  if(printInfo) printServerInfo(ns, target);
  target = await weakenToMinimum(ns, host, target, threadLimit, printInfo);
  //phase two, maximize cash while maintaining minimum
  target = await growToMaximum(ns, host, target, threadLimit, printInfo);
  ns.tprintf("Server %s prepared", target.hostname);
}

export async function growToMaximum(ns: NS, host: Server, targetServer: Server, threadLimit: number, printInfo = false): Promise<Server> {
  while (targetServer.moneyMax > targetServer.moneyAvailable) {
    const sw = ns.weakenAnalyze(1);
    const sg = ns.growthAnalyzeSecurity(1);
    if (threadLimit == 0) host = ns.getServer( host.hostname);
    const weakenThreads =  Math.ceil((threadLimit > 0 ? threadLimit : ((host.maxRam/1.75) - 1)) / ((sw / sg) + 1));
    const growThreads = (threadLimit > 0 ? threadLimit : ((host.maxRam/1.75) - 1)) - weakenThreads;
    if (printInfo)
      ns.tprintf("Growing %s with %d grow threads and %d weaken threads", targetServer.hostname, growThreads, weakenThreads);
    ns.exec("grow.js", host.hostname, growThreads, targetServer.hostname);
    ns.exec("weaken.js", host.hostname, weakenThreads, targetServer.hostname);
    const weakenTime = ns.getWeakenTime(targetServer.hostname);
    if (printInfo)
      ns.tprintf("Waiting %s for weaken", ns.tFormat(weakenTime,false));
    await ns.sleep(weakenTime + 1000);
    targetServer = ns.getServer( targetServer.hostname);
    if (printInfo)
      printServerInfo(ns, targetServer);
  }
  return targetServer;
}

export async function weakenToMinimum(ns: NS, host: Server, target: Server, threadLimit: number, printInfo = false): Promise<Server> {
  while (target.hackDifficulty > target.minDifficulty) {
    if (threadLimit == 0) host = ns.getServer( host.hostname);
    const useableThreads = threadLimit > 0 ? threadLimit : ((host.maxRam/1.75) - 1)
    const difference = target.hackDifficulty - target.minDifficulty;
    const threads = Math.ceil(difference / ns.weakenAnalyze(1));
    if (printInfo)
      ns.tprintf("Need %d threads to weaken %s", threads, target.hostname);
    if (threads > useableThreads) {
      ns.exec("weaken.js", host.hostname, useableThreads, target.hostname);
    } else {
      ns.exec("weaken.js", host.hostname, threads, target.hostname);
    }
    const weakenTime = ns.getWeakenTime(target.hostname);
    if (printInfo)
      ns.tprintf("Waiting %s seconds for weaken", ns.tFormat(weakenTime, false));
    await ns.sleep(weakenTime + 1000);
    target = ns.getServer( target.hostname);
    if (printInfo)
      printServerInfo(ns, target);
  }
  return target;
}
