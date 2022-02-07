/* eslint-disable no-fallthrough */
import { NS, Server } from '@ns';
import { ThreadRatios } from '/ThreadRatios';

export const GB_MULT = 1073741824;

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
  await ns.scp('ports.js', "home", host);
  return true;
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