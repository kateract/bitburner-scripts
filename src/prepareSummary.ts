import { NS } from '@ns'
import { compare } from 'lib/functions';
import { getServerSummary } from '/visualize'

export async function main(ns : NS) : Promise<void> {
  const targets = ns.ps().filter(p => p.filename == "prepareServer.js").map(p => p.args[0].toString());
  if (targets.length == 0) return;
  const infos = targets.map(t => ns.getServer(t));
  infos.sort((a, b) => compare(a.moneyAvailable!/a.moneyMax!,b.moneyAvailable!/b.moneyMax!))
  const sum = infos.map(i => getServerSummary(ns, i))
  const len = sum.map(s => s.length).reduce((p, c) => p < c ? c : p);
  sum.forEach(s => {
    ns.tprintf(s.padStart(len + 1, " "))
  })
}