/* eslint-disable no-fallthrough */
import { NS, Server } from '@ns';
import { ThreadRatios } from '/lib/ThreadRatios';


export function isHackable(ns: NS, serverInfo: Server): boolean {
  return serverInfo.moneyMax > 0 && serverInfo.requiredHackingSkill <= ns.getHackingLevel() && serverInfo.hasAdminRights
}

/** @param {NS} ns **/

export function isRootable(ns: NS, serverInfo: Server): boolean {
  if (serverInfo.hasAdminRights) {
    return false;
  }
  let portAttacks = 0;
  portAttacks += ns.fileExists("BruteSSH.exe") ? 1 : 0;
  portAttacks += ns.fileExists("FTPCrack.exe") ? 1 : 0;
  portAttacks += ns.fileExists("relaySMTP.exe") ? 1 : 0;
  portAttacks += ns.fileExists("HTTPWorm.exe") ? 1 : 0;
  portAttacks += ns.fileExists("SQLInject.exe") ? 1 : 0;
  return portAttacks >= serverInfo.numOpenPortsRequired;
}


/** @param {NS} ns **/
export function killProcesses(ns: NS, serverInfo: Server): boolean {
  if (!serverInfo.hasAdminRights) return false;
  //ns.tprintf("killing processes on %s", serverInfo.server);
  const procs = ns.ps(serverInfo.hostname);
  procs.forEach(p => ns.kill(p.filename, serverInfo.hostname, p.args[0]));
  return true;
}

/** @param {NS} ns **/
export function rootServer(ns: NS, serverInfo: Server): boolean {
  if (!isRootable(ns, serverInfo)) {
    return false;
  }
  if (!serverInfo.ftpPortOpen && ns.fileExists("FTPCrack.exe")) ns.ftpcrack(serverInfo.hostname);
  if (!serverInfo.sqlPortOpen && ns.fileExists("SQLInject.exe")) ns.sqlinject(serverInfo.hostname);
  if (!serverInfo.smtpPortOpen && ns.fileExists("relaySMTP.exe")) ns.relaysmtp(serverInfo.hostname);
  if (!serverInfo.httpPortOpen && ns.fileExists("HTTPWorm.exe")) ns.httpworm(serverInfo.hostname);
  if (!serverInfo.sshPortOpen && ns.fileExists("BruteSSH.exe")) ns.brutessh(serverInfo.hostname);
  ns.nuke(serverInfo.hostname);
  return true;
}

/** @param {NS} ns **/
/** @param {Server} host **/
export async function populateServer(ns: NS, server: string | Server): Promise<boolean> {
  let host = ""
  if (typeof server === "object") {
    if (!server.hasAdminRights) {
      ns.tprintf("tried to populate non-admin server %s", server.hostname);
      return false;
    }
    host = server.hostname
  }
  else {
    host = server;
  }
  await ns.scp('hack.js', "home", host);
  await ns.scp('weaken.js', "home", host);
  await ns.scp('grow.js', "home", host);
  await ns.scp('hackForever.js', "home", host);
  await ns.scp('weakenForever.js', "home", host);
  await ns.scp('growForever.js', "home", host);
  await ns.scp('weakenTwice.js', "home", host);
  await ns.scp('dispatcher.js', "home", host);
  await ns.scp('prepareServer.js', "home", host);
  await ns.scp('functions.js', "home", host);
  await ns.scp('ratios.js', "home", host);
  await ns.scp('ThreadRatios.js', "home", host);
  await ns.scp('noodles.js', "home", host);

  return true;
}



/** @param {NS} ns **/
export function macaroni(ns: NS, serverInfo: Server, target: string, hackRatio: number, weakenRatio: number, growRatio: number): void {
  const memory = serverInfo.maxRam * .98;
  const total = hackRatio + weakenRatio + growRatio;
  const instances = (memory / 1.75)
  //ns.tprintf("memory %d; instances %d; calc mem %d", memory, instances, instances * 1.75);
  const threads = [0, 0, 0]
  for (let i = 0; i < instances; i++) {
    const select = (Math.random() * total) - hackRatio
    if (select < 0) {
      threads[0] += 1;
    } else if (select > weakenRatio) {
      threads[2] += 1;
    }
    else {
      threads[1] += 1;
    }
  }
  if (threads[0] > 0) {
    ns.exec("hackForever.js", serverInfo.hostname, threads[0], target)
  }
  if (threads[1] > 0) {
    ns.exec("weakenForever.js", serverInfo.hostname, threads[1], target)
  }
  if (threads[2] > 0) {
    ns.exec("growForever.js", serverInfo.hostname, threads[2], target)
  }

}

export function deployDispatcher(ns: NS, dispatchHost: string, hackHost: string, target: string, ratios: ThreadRatios): void {
  ns.exec("dispatcher.js", dispatchHost, 1,
    target,
    hackHost,
    Math.ceil(ratios.hackThreads));
}



export function compare(a: number | string, b: number | string, descending = false): number {
  return b === a ? 0 : ((descending ? b > a : a > b) ? 1 : -1);
}