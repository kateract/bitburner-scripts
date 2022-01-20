import { NS } from '@ns'
import { compare, getServerInfo, printServerSummary } from '/functions';

export async function main(ns : NS) : Promise<void> {
  const targets = ns.ps().filter(p => p.filename == "prepareServer.js").map(p => p.args[0]);
  const infos = targets.map(t => getServerInfo(ns, t));
  infos.sort((a, b) => compare(a.maxMoney - a.money,b.maxMoney - b.money))
  infos.forEach(t => {
    printServerSummary(ns, t);
  });
}