import { NS, Server } from '@ns'
import { Port } from '/ports';
import { ThreadRatios } from '/ThreadRatios';

export async function main(ns: NS): Promise<void> {
  ns.disableLog('ALL');
  ns.clearLog();
  ns.tail();
  const target = ns.getServer(ns.args[0].toString());
  const limMultArg = ns.args.length > 1 ? ns.args[1] as number : 0
  let threads = 0
  if (limMultArg >= 1) {
    threads = limMultArg;
  }
  else {
    threads = Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.moneyAvailable! * limMultArg));
  }
  const ratios = getRatios(ns, target, threads);
  ns.print(getRatiosSummary(ns, ratios));
  let pserv = ns.getServer( ns.getHostname());
  if (ns.serverExists("pserv-00")) {
    pserv = ns.getServer( "pserv-00")
  }
  let maxRatios = null;
  if (threads == 0)
  {
    maxRatios = await maximizeRatios(ns, target, pserv, true)
  } else {
    maxRatios = await maximize(ns, target, threads);
  }
  ns.print(ns.sprintf("Maximum for %d threads", threads > 0 ? threads : (pserv.maxRam / 1.75) - 1));
  ns.print(getRatiosSummary(ns, maxRatios as ThreadRatios));
}


export function getRatios(ns: NS, target: Server, hackThreads = 1): ThreadRatios {
  const log = ns.getPortHandle(Port.DISPATCH_LOG)
  const hostname = target.hostname;
  const ratios = new ThreadRatios();
  ratios.hackThreads = Math.ceil(hackThreads);
  let hackAmount = ns.hackAnalyze(hostname) * ratios.hackThreads;
  
  if (hackAmount >= .99) {
    ratios.hackThreads = ns.hackAnalyzeThreads(hostname, target.moneyMax! * .9);
    ns.print(ns.sprintf("Hack amount greater than 99%%(%s) , reducing to %d threads (from %d)", ns.formatNumber(hackAmount, 6), ratios.hackThreads, hackThreads));
    hackAmount = ns.hackAnalyze(hostname) * ratios.hackThreads;
  }
  const catchUp = (target.moneyMax! - target.moneyAvailable!) > 0 ? (target.moneyMax! - target.moneyAvailable!)/ target.moneyMax! : 0
  let growAmount = (1 / (1 - hackAmount)) + catchUp;
  if(growAmount <= 1) {
    log.write(`growAmount problem: ${hackAmount} hacked, ${catchUp} catchUp, setting growAmount to 10`);
    console.log(`growAmount problem: ${hackAmount} hacked, ${catchUp} catchUp, setting growAmount to 10`, target, ratios);
    growAmount = 10;
  }
  ratios.growthThreads = ns.growthAnalyze(hostname, growAmount) + 1;
  
  const weakenSecurityAmount = ns.weakenAnalyze(1);
  ratios.weakenHackThreads = (ns.hackAnalyzeSecurity(ratios.hackThreads) + target.hackDifficulty! - target.minDifficulty!) / weakenSecurityAmount + 2;
  ratios.weakenGrowthThreads = ns.growthAnalyzeSecurity(Math.ceil(ratios.growthThreads)) / weakenSecurityAmount + 1;
  ratios.hackTime = Math.ceil(ns.getHackTime(hostname));
  ratios.growTime = Math.ceil(ns.getGrowTime(hostname));
  ratios.weakenTime = Math.ceil(ns.getWeakenTime(hostname));
  return ratios;
}

export async function maximizeRatios(ns: NS, target: Server, host: Server, printInfo = false): Promise<ThreadRatios> {
  if (printInfo) ns.print(ns.sprintf("Maximizing for %s from %s", target.hostname, host.hostname));
  const threadLimit = (host.maxRam / 1.8) - 1;
  return maximize(ns, target, threadLimit, printInfo);
}

export function tprintRatios(ns: NS, ratios: ThreadRatios): void {
  ns.tprintf(getRatiosSummary(ns, ratios));
}
export function logRatios(ns: NS, ratios: ThreadRatios, port: Port = Port.DISPATCH_LOG): void {
  const sum = getRatiosSummary(ns, ratios);
  if (port > 0) {
    const log = ns.getPortHandle(port);
    log.write(sum);
  }
  else 
  {
    ns.print(sum);
  }
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
  const pointNine = Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.moneyAvailable! * .9))
  let mark = getRatios(ns, target, pointNine > threadLimit ? threadLimit : pointNine);
  const initialMultiplier = Math.ceil(mark.hackThreads);
  if (printInfo) ns.print(getRatiosSummary(ns, mark));
  if (printInfo) ns.print(ns.sprintf("Thread Limit: %d\nInitial Multiplier: %d", threadLimit, initialMultiplier));
  if (mark.totalThreads < threadLimit) {
    return mark;
  }
  let topMultiplier = initialMultiplier
  let bottomMultiplier = 1
  while (topMultiplier > bottomMultiplier) {
    const newMult = Math.floor(bottomMultiplier + (topMultiplier - bottomMultiplier) / 2);
    //ns.tprint( target, newMult);
    mark = getRatios(ns, target, newMult);
    if (printInfo) ns.print(ns.sprintf("%d - %d - %d - %d", bottomMultiplier, newMult, topMultiplier, mark.totalThreads));
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
    await ns.sleep(20);
  }
  return getRatios(ns, target, bottomMultiplier);
}