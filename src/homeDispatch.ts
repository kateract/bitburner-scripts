import { NS } from '@ns'
import { deployDispatcher,getRatios, getServerInfo, printRatios, totalRatios } from '/functions';
import { prepareServer } from '/prepareServer';

export async function main(ns : NS) : Promise<void> {
  const target = getServerInfo(ns, ns.args[0].toString());
  const host = getServerInfo(ns, ns.getHostname());
  await prepareServer(ns, host, target, 1000)
  const multiplier = ns.args.length > 1 && !isNaN(ns.args[1] as number) ? ns.args[1] as number : .5
  let threads = 0
  if (multiplier >= 1) {
    threads = multiplier;
  }
  else {
    threads = Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.money * multiplier));
  }
  const ratios = getRatios(ns, target.hostname, threads);
  deployDispatcher(ns, host.hostname,host.hostname, target.hostname, ratios);
  ns.tprintf("Dispatcher Deployed against %s", target.hostname);
  printRatios(ns, ratios);
}