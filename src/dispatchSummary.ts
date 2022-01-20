import { NS } from '@ns'
import { compare, getServerInfo, printServerSummary } from '/functions';

export async function main(ns : NS) : Promise<void> {
  const targets = ns.ps().filter(p => p.filename == "dispatcher.js").map(p => p.args[1]);
  const infos = targets.map(t => getServerInfo(ns, t));
  infos.sort((a, b) => compare(a.maxMoney, b.maxMoney))
  infos.forEach(t => {
    printServerSummary(ns, t);
  });
}