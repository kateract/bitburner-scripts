import { NS } from '@ns'
import { compare } from 'lib/functions';
import {  getServerSummary } from '/visualize'

export async function main(ns : NS) : Promise<void> {
  const targets = ns.ps().filter(p => p.filename == "dispatcher.js" || p.filename == "dispatcher2.js").map(p => p.args[0].toString());
  if (targets.length == 0) return;
  const infos = targets.map(t => ns.getServer( t));
  infos.sort((a, b) => compare(a.moneyMax, b.moneyMax))
  const sum = infos.map(i => getServerSummary(ns, i))
  const len = sum.map(s => s.length).reduce((p, c) => p < c ? c : p);
  let i = 1;
  sum.forEach(s => {
    ns.tprintf(ns.nFormat(i++, "##00") + s.padStart(len + 1, " "))
  })
}