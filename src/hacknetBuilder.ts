import { NodeStats, NS } from '@ns'

export async function main(ns: NS): Promise<void> {
  ns.tail();
  ns.disableLog("ALL");
  ns.clearLog();
  while (true) {
    const nodes = getNodeStats(ns);
    const action = getCheapestUpgrade(ns, nodes);
    ns.print(action.getString(ns));
    if (action.action == HacknetActions.NONE) {
      ns.exit();
    }
    while (action.cost > ns.getServerMoneyAvailable("home") / 2) {
      await ns.sleep(1000);
    }
    switch (action.action) {
      case HacknetActions.UPGRADE_LEVEL:
        ns.hacknet.upgradeLevel(action.node, 1);
        break;
      case HacknetActions.UPGRADE_RAM:
        ns.hacknet.upgradeRam(action.node, 1);
        break;
      case HacknetActions.UPGRADE_CORE:
        ns.hacknet.upgradeCore(action.node, 1);
        break;
      case HacknetActions.BUY_NODE:
        ns.hacknet.purchaseNode();
        break;
    }
    await ns.sleep(500);
  }
}

function getNodeStats(ns: NS): NodeStats[] {
  const nodeCount = ns.hacknet.numNodes();
  const nodes: NodeStats[] = [];
  for (let i = 0; i < nodeCount; i++) {
    nodes.push(ns.hacknet.getNodeStats(i));
  }
  return nodes;
}

function getCheapestUpgrade(ns: NS, nodes: NodeStats[]): ActionNode {
  const maxNodes = ns.hacknet.maxNumNodes();
  let purchaseCost = 0;
  const upgradeLevelCosts: number[] = [];
  const upgradeRamCosts: number[] = [];
  const upgradeCoreCosts: number[] = [];
  if (nodes.length < maxNodes) {
    purchaseCost = ns.hacknet.getPurchaseNodeCost();
  } else {
    purchaseCost = Infinity;
  }
  for (let i = 0; i < nodes.length; i++) {
    //ns.formulas.hacknetNodes.moneyGainRate(nodes[i].level, nodes[i].ram, nodes[i].cores)
    upgradeLevelCosts.push(nodes[i].level < 200 ? ns.hacknet.getLevelUpgradeCost(i, 1) : Infinity);
    upgradeRamCosts.push(ns.hacknet.getRamUpgradeCost(i, 1));
    upgradeCoreCosts.push(ns.hacknet.getCoreUpgradeCost(i, 1));
  }
  const minLevelIndex = upgradeLevelCosts.indexOf(Math.min(...upgradeLevelCosts));
  const minRamIndex = upgradeRamCosts.indexOf(Math.min(...upgradeRamCosts));
  const minCoreIndex = upgradeCoreCosts.indexOf(Math.min(...upgradeCoreCosts));
  const actions = [upgradeLevelCosts[minLevelIndex], upgradeRamCosts[minRamIndex], upgradeCoreCosts[minCoreIndex]];
  if (purchaseCost > 0) actions.push(purchaseCost);
  const action: HacknetActions = actions.indexOf(Math.min(...actions));
  if (actions[action] == Infinity) {
    return new ActionNode(HacknetActions.NONE, 0, 0);
  }
  switch (action) {
    case HacknetActions.UPGRADE_LEVEL:
      return new ActionNode(action, minLevelIndex, upgradeLevelCosts[minLevelIndex]);
    case HacknetActions.UPGRADE_RAM:
      return new ActionNode(action, minRamIndex, upgradeRamCosts[minRamIndex]);
    case HacknetActions.UPGRADE_CORE:
      return new ActionNode(action, minCoreIndex, upgradeCoreCosts[minCoreIndex]);
    case HacknetActions.BUY_NODE:
      return new ActionNode(action, nodes.length, purchaseCost);
  }
  return new ActionNode(HacknetActions.NONE, 0, 0);
}

class ActionNode {
  constructor(action: HacknetActions, node: number, cost: number) {
    this.action = action;
    this.node = node;
    this.cost = cost;
  }
  action: HacknetActions = HacknetActions.NONE;
  node = 0;
  cost = 0;
  public getString(ns: NS): string {
    switch (this.action) {
      case HacknetActions.UPGRADE_LEVEL:
        return ns.sprintf("Upgrade Level of node %d for %s", this.node, ns.nFormat(this.cost, "$0.00"));
      case HacknetActions.UPGRADE_RAM:
        return ns.sprintf("Upgrade Ram of node %d for %s", this.node, ns.nFormat(this.cost, "$0.00"));
      case HacknetActions.UPGRADE_CORE:
        return ns.sprintf("Upgrade Cores of node %d for %s", this.node, ns.nFormat(this.cost, "$0.00"));
      case HacknetActions.BUY_NODE:
        return ns.sprintf("Buy node %d for %s", this.node, ns.nFormat(this.cost, "$0.00"));
      case HacknetActions.NONE:
        return "No hacknet upgrades available";
    }
  }
}

enum HacknetActions {
  NONE = -1,
  UPGRADE_LEVEL = 0,
  UPGRADE_RAM = 1,
  UPGRADE_CORE = 2,
  BUY_NODE = 3
}

