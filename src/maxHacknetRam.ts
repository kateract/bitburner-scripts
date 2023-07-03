import { NS } from '@ns'

export async function main (ns: NS){ 
  ns.disableLog('ALL');
  ns.clearLog();
  ns.tail();
  const h = ns.hacknet;
  const money = () => ns.getServerMoneyAvailable('home')
  let maxed = false
  while (!maxed) {
    if (h.numNodes() < h.maxNumNodes()) {
      if (money() > h.getPurchaseNodeCost()) {
        ns.print("buying hacknet node")
        h.purchaseNode();
      }
    }
    const nodeRam = Array(h.numNodes()).fill(0).map((x, i) => h.getNodeStats(i).ram);
    for(let i = 0; i < nodeRam.length; i++) {
      while(h.getRamUpgradeCost(i) < money()) {
        ns.print(`upgrade ram server ${i}` )
        h.upgradeRam(i);

        await ns.sleep(0);
      }
    }
    const nodemaxRam = nodeRam.map((r, i) => h.getRamUpgradeCost(i) >= Number.MAX_VALUE)

    maxed = (h.numNodes() == h.maxNumNodes() && nodemaxRam.every(v => v))

    await ns.sleep(1000);

  }
}