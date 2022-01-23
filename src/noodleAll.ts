import { NS } from '@ns'
import { explore } from '/explore'
import { isHackable } from '/functions';

export async function main(ns : NS) : Promise<void> {
  const servers = (await explore(ns, "home")).filter(s => isHackable(ns, s) && s.maxRam > 0);
  for(const s of servers)
  {
    if (ns.ps(s.hostname).length == 0){

      const threads = Math.floor(s.maxRam / ns.getScriptRam("weaken.js"));
      //ns.tprint(s, threads);
      ns.exec("noodles.js", "home", 1, s.hostname, s.minDifficulty, s.moneyMax, threads);
    }
    await ns.sleep(200);
  }
}