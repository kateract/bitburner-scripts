import { NS } from '@ns'
import { deployDispatcher } from '/functions';
import { prepareServer } from '/prepareServer';
import { getRatios, printRatios } from '/ratios'

export async function main(ns : NS) : Promise<void> {
  const target = ns.getServer( ns.args[0].toString());
  const host = ns.getServer( ns.getHostname());
  await prepareServer(ns, host, target, (host.maxRam - host.ramUsed)/2 < 5000 ? (host.maxRam - host.ramUsed)/2 : 5000)
  const multiplier = ns.args.length > 1 && !isNaN(ns.args[1] as number) ? ns.args[1] as number : .9
  let threads = 0
  if (multiplier >= 1) {
    threads = multiplier;
  }
  else {
    threads = Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.moneyAvailable * multiplier));
  }
  const ratios = getRatios(ns, target, threads);
  deployDispatcher(ns, host.hostname,host.hostname, target.hostname, ratios);
  ns.tprintf("Dispatcher Deployed against %s", target.hostname);
  printRatios(ns, ratios);
}