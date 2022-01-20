import { NS } from '@ns'
import { getServerInfo, printServerInfo } from './functions'
import { ServerInfo } from '/ServerInfo';

export async function main(ns: NS): Promise<void> {
  const target = getServerInfo(ns, ns.args[0].toString());
  let host = ns.getHostname();
  if (ns.args.length > 1) host = ns.args[1].toString();
  let threadLimit = 0
  if (ns.args.length > 2) threadLimit = ns.args[2] as number;
  let printInfo = false;
  if (ns.args.length > 3) printInfo = true;
  await prepareServer(ns, getServerInfo(ns, host), target, threadLimit, printInfo);
}


/** @param {NS} ns **/
export async function prepareServer(ns: NS, host: ServerInfo, target: ServerInfo, threadLimit = 0, printInfo = false): Promise<void> {
  //phase one, weaken to min sec level
  if(printInfo) printServerInfo(ns, target);
  target = await weakenToMinimum(ns, host, target, threadLimit, printInfo);
  //phase two, maximize cash while maintaining minimum
  target = await growToMaximum(ns, host, target, threadLimit, printInfo);
  ns.tprintf("Server %s prepared", target.hostname);
}

export async function growToMaximum(ns: NS, host: ServerInfo, targetServer: ServerInfo, threadLimit: number, printInfo = false): Promise<ServerInfo> {
  while (targetServer.maxMoney > targetServer.money) {
    const sw = ns.weakenAnalyze(1);
    const sg = ns.growthAnalyzeSecurity(1);
    if (threadLimit == 0) host = getServerInfo(ns, host.hostname);
    const weakenThreads =  ((threadLimit > 0 ? threadLimit : ((host.ram/1.75) - 1)) / ((sw / sg) + 1));
    const growThreads = (threadLimit > 0 ? threadLimit : ((host.ram/1.75) - 1)) - weakenThreads;
    if (printInfo)
      ns.tprintf("Growing %s with %d grow threads and %d weaken threads", targetServer.hostname, growThreads, weakenThreads);
    ns.exec("grow.js", host.hostname, growThreads, targetServer.hostname);
    ns.exec("weaken.js", host.hostname, weakenThreads, targetServer.hostname);
    const weakenTime = ns.getWeakenTime(targetServer.hostname);
    if (printInfo)
      ns.tprintf("Waiting %0.0f seconds for weaken", weakenTime / 1000);
    await ns.sleep(weakenTime + 1000);
    targetServer = getServerInfo(ns, targetServer.hostname);
    if (printInfo)
      printServerInfo(ns, targetServer);
  }
  return targetServer;
}

export async function weakenToMinimum(ns: NS, host: ServerInfo, target: ServerInfo, threadLimit: number, printInfo = false): Promise<ServerInfo> {
  while (target.securityLevel > target.minSecurityLevel) {
    if (threadLimit == 0) host = getServerInfo(ns, host.hostname);
    const useableThreads = threadLimit > 0 ? threadLimit : ((host.ram/1.75) - 1)
    const difference = target.securityLevel - target.minSecurityLevel;
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
      ns.tprintf("Waiting %0.0f seconds for weaken", weakenTime / 1000);
    await ns.sleep(weakenTime + 1000);
    target = getServerInfo(ns, target.hostname);
    if (printInfo)
      printServerInfo(ns, target);
  }
  return target;
}
