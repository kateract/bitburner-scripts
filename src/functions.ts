/* eslint-disable no-fallthrough */
import { NS, Server } from '@ns';
import { codingContractTypesMetadata } from '/codingcontracttypes';
import { ThreadRatios } from '/ThreadRatios';

/** @param {NS} ns **/
export async function explore(ns: NS, server: string, oldServer = "", list: Server[] = []): Promise<Server[]> {
  //ns.tprintf("Exploring Server: %s", server);
  const res = ns.scan(server);
  const servers = res
    .filter(f => f != oldServer)
    .map(f => ns.getServer( f));
  await servers.forEach(async s => {
    if (!list.find(l => l.hostname === s.hostname)) {
      list.push(s);
    }
    await explore(ns, s.hostname, server, list);
  });
  return list;
}


/** @param {NS} ns **/

export function printServerInfo(ns: NS, serverInfo: Server): void {
  {
    ns.tprintf("Server: %s %s\n  Hacking Level: %-1d %s\n  Ports Req: %-1d %s\n  Security level: %0.3f(%0.3f)\n  Money: %s/%s\n  Growth: %0.3f\n  RAM: %0.2f",
      serverInfo.hostname,
      serverInfo.hasAdminRights ? "ADMIN" : "",
      serverInfo.requiredHackingSkill,
      isHackable(ns, serverInfo) ? "HACKABLE" : "",
      serverInfo.numOpenPortsRequired,
      isRootable(ns, serverInfo) ? "ROOTABLE" : "",
      serverInfo.hackDifficulty,
      serverInfo.minDifficulty,
      ns.nFormat(serverInfo.moneyAvailable, "0.0a"),
      ns.nFormat(serverInfo.moneyMax, "0.0a"),
      serverInfo.serverGrowth,
      serverInfo.maxRam);
  }
}

export function printServerSummary(ns: NS, serverInfo: Server): void {
  ns.tprintf("%20s: Money - %10s(%10s)  |  Security - %8s(%8s)", serverInfo.hostname, ns.nFormat(serverInfo.moneyAvailable, "$0.000 a"), ns.nFormat(serverInfo.moneyMax, "$0.000 a"), ns.nFormat(serverInfo.hackDifficulty, "0.000"), ns.nFormat(serverInfo.minDifficulty, "0.000"))
}

/** @param {NS} ns **/

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
  switch (serverInfo.numOpenPortsRequired) {
    case 5:
    case 4:
    case 3:
    case 2:
      if (ns.fileExists("FTPCrack.exe")) ns.ftpcrack(serverInfo.hostname);
      if (ns.fileExists("SQLInject.exe")) ns.sqlinject(serverInfo.hostname);
      if (ns.fileExists("relaySMTP.exe")) ns.relaysmtp(serverInfo.hostname);
      if (ns.fileExists("HTTPWorm.exe")) ns.httpworm(serverInfo.hostname);
    case 1:
      ns.brutessh(serverInfo.hostname);
    case 0:
      ns.nuke(serverInfo.hostname);
      return true;
    default:
      return false;

  }
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
  return true;
}

/** @param {NS} ns **/
export function analyzeTarget(ns: NS, serverInfo: Server): void {
  const hackTime = ns.getHackTime(serverInfo.hostname) / 1000;
  const hackAnalyze = ns.hackAnalyze(serverInfo.hostname);
  const hackThreads = ns.hackAnalyzeThreads(serverInfo.hostname, serverInfo.moneyAvailable / 2);
  const hackSecurity = ns.hackAnalyzeSecurity(hackThreads);
  const growTime = ns.getGrowTime(serverInfo.hostname) / 1000;
  const growEffect = ns.growthAnalyze(serverInfo.hostname, 1 + hackAnalyze);
  const growDouble = ns.growthAnalyze(serverInfo.hostname, 2);
  const growMaximize = ns.growthAnalyze(serverInfo.hostname, serverInfo.moneyMax / serverInfo.moneyAvailable);
  const growSecurity = ns.growthAnalyzeSecurity(growEffect);
  const weakenTime = ns.getWeakenTime(serverInfo.hostname) / 1000;
  const weakenEffect = ns.weakenAnalyze(1, 1);

  ns.tprint("hack time: ", hackTime.toString());
  ns.tprint("hack amount: ", hackAnalyze.toString());
  ns.tprint("hack threads for 50%: ", hackThreads)
  ns.tprint("hack security inc: ", hackSecurity.toString());
  ns.tprint("grow time: ", growTime.toString());
  ns.tprint("grow threads for hack amount: ", growEffect);
  ns.tprint("grow threads to double: ", growDouble);
  ns.tprint("grow security for threads above: ", growSecurity);
  ns.tprint("grow threads to maximize: ", growMaximize);
  ns.tprint("weaken time: ", weakenTime.toString());
  ns.tprint("weaken effect: ", weakenEffect.toString());
  ns.tprint("weaken hack threads: ", hackSecurity / weakenEffect)
  ns.tprint("weaken grow threads: ", growSecurity / weakenEffect)
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

export function getRatios(ns: NS, target: string | Server, hackThreads = 1): ThreadRatios {
  const hostname = (typeof target === "object") ? target.hostname : target;
  const ratios = new ThreadRatios();
  ratios.hackThreads = Math.ceil(hackThreads);
  const hackAmount = ns.hackAnalyze(hostname) * ratios.hackThreads;
  ratios.growthThreads = ns.growthAnalyze(hostname, 1.1 / (1 - hackAmount)) + 1;
  const weakenSecurityAmount = ns.weakenAnalyze(1);
  ratios.weakenHackThreads = ns.hackAnalyzeSecurity(ratios.hackThreads) / weakenSecurityAmount;
  ratios.weakenGrowthThreads = ns.growthAnalyzeSecurity(Math.ceil(ratios.growthThreads)) / weakenSecurityAmount;
  ratios.hackTime = ns.getHackTime(hostname);
  ratios.growTime = ns.getGrowTime(hostname);
  ratios.weakenTime = ns.getWeakenTime(hostname);
  return ratios;
}

export async function maximizeRatios(ns: NS, target: Server, host: Server, printInfo = false): Promise<ThreadRatios> {
  if (printInfo) ns.tprintf("Maximizing for %s from %s", target.hostname, host.hostname);
  const threadLimit = (host.maxRam / 1.75) - 1;
  const baseline = getRatios(ns, target, 1);

  let mark = getRatios(ns, target, Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.moneyAvailable * .5)));
  const initialMultiplier = Math.ceil(mark.hackThreads);
  if (printInfo) printRatios(ns, mark);
  if (printInfo) ns.tprintf("Thread Limit: %d\nInitial Multiplier: %d", threadLimit, initialMultiplier);
  if (totalRatios(mark) < threadLimit) {
    return mark;
  }
  let topMultiplier = initialMultiplier
  let bottomMultiplier = 1
  while (topMultiplier > bottomMultiplier) {
    const newMult = Math.floor(bottomMultiplier + (topMultiplier - bottomMultiplier) / 2);
    //ns.tprint( target, newMult);
    mark = getRatios(ns, target, newMult);
    if (printInfo) ns.tprintf("%d - %d - %d - %d", bottomMultiplier, newMult, topMultiplier, totalRatios(mark));
    if (newMult == bottomMultiplier) {
      return mark;
    }
    else if (totalRatios(mark) < threadLimit) {
      bottomMultiplier = newMult;
    }
    else if (totalRatios(mark) > threadLimit) {
      topMultiplier = newMult;
    } else {
      return mark;
    }
    await ns.sleep(100);
  }
  return getRatios(ns, target, bottomMultiplier);
}

export function printRatios(ns: NS, ratios: ThreadRatios): void {
  ns.tprintf("Hack Threads: %d (%f)", ratios.hackThreads, ratios.hackThreads);
  ns.tprintf("Growth Threads: %d (%f)", Math.ceil(ratios.growthThreads), ratios.growthThreads);
  ns.tprintf("Weaken(hack) Threads: %d (%f)", Math.ceil(ratios.weakenHackThreads), ratios.weakenHackThreads);
  ns.tprintf("Weaken(grow) Threads: %d (%f)", Math.ceil(ratios.weakenGrowthThreads), ratios.weakenGrowthThreads);
  // ns.tprint("Hack Time: ", ratios.hackTime);
  // ns.tprint("Grow Time: ", ratios.growTime);
  // ns.tprint("Weaken Time: ", ratios.weakenTime);
  const total = totalRatios(ratios);
  ns.tprintf("%d total threads", total)
}

export function totalRatios(ratios: ThreadRatios): number {
  return ratios.hackThreads + Math.ceil(ratios.growthThreads) + Math.ceil(ratios.weakenHackThreads) + Math.ceil(ratios.weakenGrowthThreads)
}

export function deployDispatcher(ns: NS, dispatchHost: string, hackHost: string, target: string, ratios: ThreadRatios): void {
  ns.exec("dispatcher.js", dispatchHost, 1,
    hackHost,
    target,
    Math.ceil(ratios.hackThreads));
}

export function contractSolver(ns: NS, host: string, file: string): boolean {
  const type = ns.codingcontract.getContractType(file, host);
  const data = ns.codingcontract.getData(file, host);
  ns.tprintf("Contract %s found on %s: %s", file, host, type);
  const contract = codingContractTypesMetadata.find(c => c.name == type);
  let answer: any;
  let solved = contract?.solver(data, answer) ?? false
  solved = solved ? ns.codingcontract.attempt(answer, file, host) as boolean : false;
  return solved;
}

export async function searchContracts(ns: NS): Promise<void> {
  while (true) {


    const servers = await explore(ns, "home");

    for (const server of servers) {
      const contracts = ns.ls(server.hostname, ".cct");
      contracts.forEach(c => contractSolver(ns, server.hostname, c));
    }
    await ns.sleep(60 * 1000);
  }
}


export function compare(a: number | string, b: number | string, descending = false): number {
  return b === a ? 0 : ((descending ? b > a : a > b) ? 1 : -1);
}