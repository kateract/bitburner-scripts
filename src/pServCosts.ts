import { NS } from '@ns'
import { GB_MULT } from '/functions';

export async function main(ns : NS) : Promise<void> {
  
	const levels = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576]
  const costs = levels.map(l => ns.getPurchasedServerCost(l));
  for (let i = 0; i < levels.length; i++) {
    ns.tprintf("Level %d: %s ram costing %s", i + 1, ns.nFormat(levels[i]*GB_MULT, "0.000 ib"), ns.nFormat(costs[i], "$ 0.00 a"))
  }
}