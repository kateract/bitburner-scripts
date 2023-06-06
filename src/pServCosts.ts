import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
  const MaxServerCount = ns.getPurchasedServerLimit();
  const levels = Array.from({ length: Math.log2(ns.getPurchasedServerMaxRam()) }, (_, i) => Math.pow(2, i + 1));
  const costs = levels.map(l => ns.getPurchasedServerCost(l));
  levels.forEach((level, index) => {
    ns.tprintf("Level %d: %s ram costing $%s($%s)", index, ns.formatRam(level), ns.formatNumber(costs[index]), ns.formatNumber(costs[index] * MaxServerCount))
  })
  const funds = ns.getServerMoneyAvailable("home");
  let level = costs.findIndex(c => c > funds / MaxServerCount)
  if (level > 0) level--;
  if (level >= 0) {
    ns.tprintf(`You can buy ${MaxServerCount} servers at level ${level}.`);
  }
}