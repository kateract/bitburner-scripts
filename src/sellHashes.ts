import { NS } from '@ns';

export async function main(ns: NS) {
  ns.disableLog('sleep');
  ns.clearLog();
  ns.tail();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (ns.hacknet.numHashes() > .95 * ns.hacknet.hashCapacity()) {
      ns.hacknet.spendHashes("Sell for Money", undefined, Math.floor((ns.hacknet.numHashes() * .1) / 4))
    }
    await ns.sleep(5000);
  }
}