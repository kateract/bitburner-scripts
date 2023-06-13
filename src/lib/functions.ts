/* eslint-disable no-fallthrough */
import { NS, Server } from '@ns';
import { ThreadRatios } from '/ThreadRatios';
import { ProcessTiming } from '/ProcessTiming';

export const GB_MULT = 1073741824;

export function isHackable(ns: NS, serverInfo: Server): boolean {
  return (serverInfo.moneyMax ?? 0) > 0 && (serverInfo.requiredHackingSkill ?? 0) <= ns.getHackingLevel() && serverInfo.hasAdminRights
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
  return portAttacks >= (serverInfo.numOpenPortsRequired ?? 0);
}


/** @param {NS} ns **/
export function killProcesses(ns: NS, serverInfo: Server): boolean {
  if (!serverInfo.hasAdminRights) return false;
  //ns.tprintf("killing processes on %s", serverInfo.hostname);
  const procs = ns.ps(serverInfo.hostname);
  procs.forEach(p => ns.kill(p.filename, serverInfo.hostname, ...p.args));
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
  await ns.scp('hack.js', host, "home");
  await ns.scp('weaken.js', host, "home");
  await ns.scp('grow.js', host, "home");
  await ns.scp('hackForever.js', host, "home");
  await ns.scp('weakenForever.js', host, "home");
  await ns.scp('growForever.js', host, "home");
  await ns.scp('weakenTwice.js', host, "home");
  await ns.scp('dispatcher.js', host, "home");
  await ns.scp('prepareServer.js', host, "home");
  await ns.scp('functions.js', host, "home");
  await ns.scp('ratios.js', host, "home");
  await ns.scp('ThreadRatios.js', host, "home");
  await ns.scp('noodles.js', host, "home");
  await ns.scp('ports.js', host, "home");
  await ns.scp('autoConnect.js', host, "home");
  return true;
}


export function deployDispatcher(ns: NS, dispatchHost: string, hackHost: string, target: string, ratios: ThreadRatios): void {
  ns.exec("dispatcher.js", dispatchHost, 1,
    target,
    hackHost,
    Math.ceil(ratios.hackThreads));
}

export function deployDispatcher2(ns: NS, dispatchHost: string, hackHost: string, target: string): void {
  ns.exec("dispatcher2.js", dispatchHost, 1,
    target,
    hackHost);
}




export function compare(a: number | string, b: number | string, descending = false): number {
  return b === a ? 0 : ((descending ? b > a : a > b) ? 1 : -1);
}

export function batchHWGW (ns: NS, ratios: ThreadRatios, threadLimit: number, batch: ProcessTiming[] = [], spacing = 1000) : ProcessTiming[] {
  let offset = batch.reduce((p, c) => p < (c.offset - spacing) ? p : c.offset - spacing, 0);
  batch.forEach(b => b.offset -= offset);
  offset = 0;
  let threadCount = batch.filter(b => b.adjustedTime > offset).map(b => b.threads).reduce((p, c) => p + c, 0)
  let cycleCount = 0;
  let complete = false;
  while (threadCount + ratios.totalThreads <= threadLimit && !complete) {
    if (batch.filter(b => b.adjustedTime >= offset - spacing/2 && b.adjustedTime <= (offset + 4.5 * spacing)).length == 0) {
      batch.push(new ProcessTiming("weaken.js", ratios.weakenTime, Math.ceil(ratios.weakenGrowthThreads), offset));
      batch.push(new ProcessTiming("grow.js", ratios.growTime, Math.ceil(ratios.growthThreads), offset + spacing * 1));
      batch.push(new ProcessTiming("weaken.js", ratios.weakenTime, Math.ceil(ratios.weakenHackThreads), offset + spacing * 2));
      batch.push(new ProcessTiming("hack.js", ratios.hackTime, Math.ceil(ratios.hackThreads), offset + spacing * 3))
      cycleCount++;
    }
    offset -= spacing * 5;
    if (batch.length > 0 && batch[0].adjustedTime + offset < 0) complete = true;
    //console.log(batch.length, offset);
    threadCount = batch.filter(b => b.adjustedTime > offset).map(b => b.threads).reduce((p, c) => p + c, 0)
  } 
  if (cycleCount > 0) ns.print(`Added ${cycleCount} cycles.`);
  return batch.sort((a, b) => compare(a.adjustedTime, b.adjustedTime, true));
}

export function batchPrepare (ns: NS, target: Server, threadLimit: number, batch: ProcessTiming[] = [], spacing = 1000) : ProcessTiming[] {
  let offset = batch.reduce((p, c) => p < (c.offset - spacing) ? p : c.offset - spacing, 0);
  const simServer = ns.getServer(target.hostname);
  let weakenPhaseThreads = 0
  let weakenTime = 0
  if (target.minDifficulty! < target.hackDifficulty!) {
    //console.log('weakening', target.hostname)
    const difference = target.hackDifficulty! - target.minDifficulty!;
    weakenPhaseThreads = Math.ceil(difference / ns.weakenAnalyze(1));
    weakenTime = ns.formulas.hacking.weakenTime(target, ns.getPlayer())
    while (weakenPhaseThreads > threadLimit) {
      weakenTime = ns.formulas.hacking.weakenTime(simServer, ns.getPlayer())
      batch.push(new ProcessTiming("weaken.js", weakenTime, threadLimit, offset))
      offset -= weakenTime + spacing
      simServer.hackDifficulty! -= 0.05 * threadLimit;
      weakenPhaseThreads -= threadLimit;
      //console.log(batch.length, offset);
    }
    batch.push(new ProcessTiming("weaken.js", weakenTime, weakenPhaseThreads, offset))
  }
  //console.log("growing", target.hostname)
  let remGrowThreads = ns.growthAnalyze(target.hostname, target.moneyMax! / target.moneyAvailable!);
  const growSecIncrease = ns.growthAnalyzeSecurity(remGrowThreads);
  const reqWeakenThreads = growSecIncrease / 0.05;
  let remGrowPhaseThreads = remGrowThreads + reqWeakenThreads;
  const ratio = Math.ceil(remGrowThreads / remGrowPhaseThreads);

  if (remGrowPhaseThreads < threadLimit - weakenPhaseThreads) {
    batch.push(new ProcessTiming("grow.js", ns.formulas.hacking.growTime(simServer, ns.getPlayer()), remGrowThreads, offset + spacing * 2))
    batch.push(new ProcessTiming("weaken.js", ns.formulas.hacking.weakenTime(simServer, ns.getPlayer()), reqWeakenThreads, offset + spacing))  
    return batch;
  }
  offset -= weakenTime + offset + spacing * 3
  while (remGrowPhaseThreads > threadLimit) {
    const curGrowThreads =  Math.floor(threadLimit * ratio) + 1
    batch.push(new ProcessTiming("grow.js", ns.formulas.hacking.growTime(simServer, ns.getPlayer()), curGrowThreads, offset + spacing * 2))
    batch.push(new ProcessTiming("weaken.js", ns.formulas.hacking.weakenTime(simServer, ns.getPlayer()), Math.ceil(ns.growthAnalyzeSecurity(curGrowThreads) / 0.05) , offset + spacing))
    offset -= weakenTime + offset + spacing * 3
    remGrowThreads -= curGrowThreads;
    remGrowPhaseThreads = remGrowThreads + Math.ceil(ns.growthAnalyzeSecurity(remGrowThreads) / 0.05);
    //console.log(batch.length, offset);
  }
  batch.push(new ProcessTiming("grow.js", ns.formulas.hacking.growTime(simServer, ns.getPlayer()), remGrowPhaseThreads, offset + spacing * 2))
  batch.push(new ProcessTiming("weaken.js", ns.formulas.hacking.weakenTime(simServer, ns.getPlayer()), Math.ceil(ns.growthAnalyzeSecurity(remGrowPhaseThreads) / 0.05) , offset + spacing))
  return batch;

}

export function msToTime(duration: number) {
  let milliseconds = Math.floor((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  const shours = (hours < 10) ? "0" + hours : hours;
  const sminutes = (minutes < 10) ? "0" + minutes : minutes;
  const sseconds = (seconds < 10) ? "0" + seconds : seconds;

  return `${shours}:${sminutes}:${sseconds}.${ milliseconds|3}`;
}
