import { NS, Server } from '@ns'
import { ThreadRatios } from '/ThreadRatios';

export async function main(ns: NS): Promise<void> {
  const target = ns.getServer(ns.args[0].toString());
  const threadLimit = ns.args.length > 1 ? ns.args[1] as number : 0
  const multiplier = ns.args.length > 1 && !isNaN(ns.args[1] as number) ? ns.args[1] as number : 1
  let threads = 0
  if (multiplier >= 1) {
    threads = multiplier;
  }
  else {
    threads = Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.moneyAvailable * multiplier));
  }
  const ratios = getRatios(ns, target, threads);
  printRatios(ns, ratios);
  let pserv = ns.getServer( ns.getHostname());
  if (ns.serverExists("pserv-00")) {
    pserv = ns.getServer( "pserv-00")
  }
  let maxRatios = null;
  if (threadLimit == 0)
  {
    maxRatios = await maximizeRatios(ns, target, pserv, true)
  } else {
    maxRatios = await maximize(ns, target, threadLimit);
  }
  ns.tprintf("Maximum for %s (%d threads)", pserv.hostname, threadLimit > 0 ? threadLimit : (pserv.maxRam / 1.75) - 1)
  printRatios(ns, maxRatios as ThreadRatios);
}


export function getRatios(ns: NS, target: Server, hackThreads = 1): ThreadRatios {
  const hostname = target.hostname;
  const ratios = new ThreadRatios();
  const cores = 6
  ratios.hackThreads = Math.ceil(hackThreads);
  let hackAmount = ns.hackAnalyze(hostname) * ratios.hackThreads;
  if (hackAmount >= .999) {
    ratios.hackThreads = ns.hackAnalyzeThreads(hostname, target.moneyAvailable * .9);
    ns.tprintf("Hack amount greater than 99.9%%(%s) , reducing to %d threads (from %d)", ns.nFormat(hackAmount, "0.000000"), ratios.hackThreads, hackThreads);
    hackAmount = ns.hackAnalyze(hostname) * ratios.hackThreads;
  }
  ratios.growthThreads = ns.growthAnalyze(hostname, Math.min(1 / (1 - hackAmount), 10.5)) + 1;
  
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
  return maximize(ns, target, threadLimit, printInfo);
}

export function printRatios(ns: NS, ratios: ThreadRatios): void {
  ns.tprintf(getRatiosSummary(ns, ratios));
}

export function getRatiosSummary(ns: NS, ratios: ThreadRatios):string {
  const strings: string[] = []
  strings.push(ns.sprintf("Hack Threads: %d (%s)", ratios.hackThreads, ns.nFormat(ratios.hackThreads, "0.00")));
  strings.push(ns.sprintf("Growth Threads: %d (%s)", Math.ceil(ratios.growthThreads), ns.nFormat(ratios.growthThreads, "0.00")));
  strings.push(ns.sprintf("Weaken(hack) Threads: %d (%s)", Math.ceil(ratios.weakenHackThreads), ns.nFormat(ratios.weakenHackThreads, "0.00")));
  strings.push(ns.sprintf("Weaken(grow) Threads: %d (%s)", Math.ceil(ratios.weakenGrowthThreads), ns.nFormat(ratios.weakenGrowthThreads, "0.00")));
  strings.push(ns.sprintf("%d total threads", ratios.totalThreads))
  return strings.join("\n");
}


export async function maximize(ns: NS, target: Server, threadLimit: number, printInfo = false): Promise<ThreadRatios>
{

  let mark = getRatios(ns, target, Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.moneyAvailable * .9)));
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