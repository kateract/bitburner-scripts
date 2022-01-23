import { NS } from '@ns'
import { explore } from 'tools/explore'
import { isHackable } from '/lib/functions';

export async function main(ns: NS): Promise<void> {
  const servers = await explore(ns, "home");
  for (const s of servers) {
    if (isHackable(ns, s)) {
      s.hasAdminRights = true;
      ns.exec("homeDispatch.js", "home", 1, s.hostname);
      await ns.sleep(200);
    }
  }
}