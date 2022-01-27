import { NS } from '@ns'
import { compare } from '/functions';
import { printServerSummary } from '/visualize'

export async function main(ns : NS) : Promise<void> {
  const targets = ns.ps().filter(p => p.filename == "prepareServer.js").map(p => p.args[0]);
  const infos = targets.map(t => ns.getServer( t));
  infos.sort((a, b) => compare(a.moneyAvailable/a.moneyMax,b.moneyAvailable/b.moneyMax))
  infos.forEach(t => {
    printServerSummary(ns, t);
  });
}