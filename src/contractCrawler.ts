import { NS } from '@ns'
import { explore } from '/explore'

export async function main(ns : NS) : Promise<void> {
  await searchContracts(ns);
}


export async function searchContracts(ns: NS): Promise<void> {
  while (true) {


    const servers = await explore(ns, "home");

    for (const server of servers) {
      const contracts = ns.ls(server.hostname, ".cct");
      //contracts.forEach(c => contractSolver(ns, server.hostname, c));
    }
    await ns.sleep(60 * 1000);
  }
}


