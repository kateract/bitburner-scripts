import { NS } from '@ns'
import { deployDispatcher } from '/functions';
import { Port } from '/ports';
import { prepareServer } from '/prepareServer';
import { getRatios, logRatios } from '/ratios'

export async function main(ns : NS) : Promise<void> {
  const log = ns.getPortHandle(Port.DISPATCH_LOG);
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
  log.write(ns.sprintf("Dispatcher Deployed against %s", target.hostname));
  logRatios(ns, ratios);
}