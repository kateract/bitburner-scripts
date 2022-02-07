import { NS } from '@ns'
// import { Port } from '/ports';
// import { getRatiosSummary, maximize } from '/ratios'

export async function main(ns : NS) : Promise<void> {
  const mults = ns.getBitNodeMultipliers();
  ns.tail();
  ns.print(mults);
  //const log = ns.getPortHandle(Port.DISPATCH_LOG);
  //const ratios = await maximize(ns, ns.getServer("foodnstuff"), 40)
  //log.write(getRatiosSummary(ns, ratios));
  // const player = ns.getPlayer()
  // const server = ns.getServer("harakiri-sushi");
  // const growTimeFormula = ns.formulas.hacking.growTime(server, player)
  // const growTimeNS = ns.getGrowTime(server.hostname);
  // ns.tprintf("Formula: %f\nNS: %f", growTimeFormula, growTimeNS);
  // ns.tprint(ns.getOwnedSourceFiles())
  
}