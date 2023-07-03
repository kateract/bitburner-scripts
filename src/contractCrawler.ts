import { NS } from '@ns'
import { explore } from '/explore'
import { contractSolver } from '/contract/contractSolver';

export async function main(ns : NS) : Promise<void> {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail()
  await searchContracts(ns);
}


export async function searchContracts(ns: NS): Promise<void> {
  // eslint-disable-next-line no-constant-condition
  while (true) {


    const servers = await explore(ns, "home");

    for (const server of servers) {
      const contracts = ns.ls(server.hostname, ".cct");
      contracts.forEach(c => contractSolver(ns, server.hostname, c));
    }
    await ns.sleep(10 * 1000);
  }
}


