import { NS } from '@ns'
import { compare } from '/lib/functions';
import {  printServerSummary } from '/lib/visualize'

export async function main(ns : NS) : Promise<void> {
  const targets = ns.ps().filter(p => p.filename == "dispatcher.js").map(p => p.args[1]);
  const infos = targets.map(t => ns.getServer( t));
  infos.sort((a, b) => compare(a.moneyMax, b.moneyMax))
  infos.forEach(t => {
    printServerSummary(ns, t);
  });
}