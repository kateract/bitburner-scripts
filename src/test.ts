import { NS } from '@ns'
import { maximize } from '/ratios'

export async function main(ns : NS) : Promise<void> {
  const ratios = await maximize(ns, ns.getServer("foodnstuff"), 40)
  ns.tprint(ratios);
  // const player = ns.getPlayer()
  // const server = ns.getServer("harakiri-sushi");
  // const growTimeFormula = ns.formulas.hacking.growTime(server, player)
  // const growTimeNS = ns.getGrowTime(server.hostname);
  // ns.tprintf("Formula: %f\nNS: %f", growTimeFormula, growTimeNS);
  // ns.tprint(ns.getOwnedSourceFiles())
}