import { NS } from '@ns'
import { explore } from '/explore'
import { isHackable } from 'lib/functions';

export async function main(ns : NS) : Promise<void> {
  const servers = (await explore(ns, "home")).filter(s => isHackable(ns, s) && s.maxRam > 0);
  for(const s of servers)
  {
    if (ns.ps(s.hostname).length == 0){

      const threads = Math.floor(s.maxRam / ns.getScriptRam("weaken.js"));
      //ns.tprint(s, threads);
      ns.exec("prepareServer.js", "home", 1, s.hostname, s.hostname, threads);
    }
    await ns.sleep(200);
  }
}