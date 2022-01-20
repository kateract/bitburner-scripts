import { NS } from '@ns'
import { compare, printServerSummary } from '/functions';

export async function main(ns : NS) : Promise<void> {
  const targets = ns.ps().filter(p => p.filename == "prepareServer.js").map(p => p.args[0]);
  const infos = targets.map(t => ns.getServer( t));
  infos.sort((a, b) => compare(a.moneyMax - a.moneyAvailable,b.moneyMax - b.moneyAvailable))
  infos.forEach(t => {
    printServerSummary(ns, t);
  });
}