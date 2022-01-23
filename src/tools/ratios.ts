import { NS, Server } from '@ns'
import { ThreadRatios } from '/lib/ThreadRatios';

export async function main(ns: NS): Promise<void> {
  const target = ns.args[0].toString();
  const multiplier = ns.args.length > 1 && !isNaN(ns.args[1] as number) ? ns.args[1] as number : 1
  let threads = 0
  if (multiplier >= 1) {
    threads = multiplier;
  }
  else {
    threads = Math.ceil(ns.hackAnalyzeThreads(target, ns.getServer( target).moneyAvailable * multiplier));
  }
  const ratios = getRatios(ns, target, threads);
  printRatios(ns, ratios);
  let pserv = ns.getServer( ns.getHostname());
  if (ns.serverExists("pserv-00")) {
    pserv = ns.getServer( "pserv-00")
  }
  const maxRatios = await maximizeRatios(ns, ns.getServer( target), pserv, true)
  ns.tprintf("Maximum for %s (%d threads)", pserv.hostname, (pserv.maxRam / 1.75) - 1)
  printRatios(ns, maxRatios);
}


export function getRatios(ns: NS, target: string | Server, hackThreads = 1): ThreadRatios {
  const hostname = (typeof target === "object") ? target.hostname : target;
  const ratios = new ThreadRatios();
  ratios.hackThreads = Math.ceil(hackThreads);
  const hackAmount = ns.hackAnalyze(hostname) * ratios.hackThreads;
  //ns.tprint(hackAmount);
  ratios.growthThreads = ns.growthAnalyze(hostname, 1.1 / (1 - hackAmount)) + 1;
  const weakenSecurityAmount = ns.weakenAnalyze(1);
  ratios.weakenHackThreads = ns.hackAnalyzeSecurity(ratios.hackThreads) / weakenSecurityAmount + 1;
  ratios.weakenGrowthThreads = ns.growthAnalyzeSecurity(Math.ceil(ratios.growthThreads)) / weakenSecurityAmount;
  ratios.hackTime = ns.getHackTime(hostname);
  ratios.growTime = ns.getGrowTime(hostname);
  ratios.weakenTime = ns.getWeakenTime(hostname);
  return ratios;
}

export async function maximizeRatios(ns: NS, target: Server, host: Server, printInfo = false): Promise<ThreadRatios> {
  if (printInfo) ns.tprintf("Maximizing for %s from %s", target.hostname, host.hostname);
  const threadLimit = (host.maxRam / 1.75) - 1;

  let mark = getRatios(ns, target, Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.moneyAvailable * .5)));
  const initialMultiplier = Math.ceil(mark.hackThreads);
  if (printInfo) printRatios(ns, mark);
  if (printInfo) ns.tprintf("Thread Limit: %d\nInitial Multiplier: %d", threadLimit, initialMultiplier);
  if (mark.totalThreads < threadLimit) {
    return mark;
  }
  let topMultiplier = initialMultiplier
  let bottomMultiplier = 1
  while (topMultiplier > bottomMultiplier) {
    const newMult = Math.floor(bottomMultiplier + (topMultiplier - bottomMultiplier) / 2);
    //ns.tprint( target, newMult);
    mark = getRatios(ns, target, newMult);
    if (printInfo) ns.tprintf("%d - %d - %d - %d", bottomMultiplier, newMult, topMultiplier, mark.totalThreads);
    if (newMult == bottomMultiplier) {
      return mark;
    }
    else if (mark.totalThreads < threadLimit) {
      bottomMultiplier = newMult;
    }
    else if (mark.totalThreads > threadLimit) {
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

  ns.tprintf("%d total threads", ratios.totalThreads)
}



export function newMaximize(ns: NS, target: string | Server, threadLimit: number, printInfo = true)
{
  const targetServer = (typeof target == "object") ? target as Server : ns.getServer(target);
  const oneHack = getRatios(ns, targetServer, 1);
  if (printInfo) printRatios(ns, oneHack);
  ns.tprint(oneHack.totalThreads)
}