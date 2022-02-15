import { NS } from '@ns'
import { batchHWGW } from '/functions';
import { getRatiosSummary, maximize } from '/ratios';
// import { Port } from '/ports';
// import { getRatiosSummary, maximize } from '/ratios'

export async function main(ns: NS): Promise<void> {
  ns.clearLog();
  ns.tail();

  const mults = ns.getBitNodeMultipliers();
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
async function batchTest(ns: NS) {
  const threadLimit = 50;
  const ratios = await maximize(ns, ns.getServer("n00dles"), threadLimit);
  ns.print(getRatiosSummary(ns, ratios));
  const batch = batchHWGW(ns, ratios, threadLimit);
  for (let index = 0; index < 40; index++) {
    if (batch.length > 0) {
      const cur = batch.shift()
      ns.print("run: ", cur?.filename, cur?.offset);
    }
    if (batch.length > 0) {
      ns.print("next: ", batch[0].filename, batch[0].offset);
    } else {
      ns.print("Queue empty, waiting for next batch");
    }
    batchHWGW(ns, ratios, threadLimit, batch);
  }
  ns.print(batch.length / 4, " Cycles");
}