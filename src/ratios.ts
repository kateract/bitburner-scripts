import { NS } from '@ns'
import { getRatios, maximizeRatios, printRatios } from '/functions';

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
  let pserv = ns.getServer( "home");
  if (ns.serverExists("pserv-00")) {
    pserv = ns.getServer( "pserv-00")
  }
  const maxRatios = await maximizeRatios(ns, ns.getServer( target), pserv)
  ns.tprintf("Maximum for %s (%d threads)", pserv.hostname, (pserv.maxRam / 1.75) - 1)
  printRatios(ns, maxRatios);
}