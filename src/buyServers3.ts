import { NS, Server } from '@ns'

import { compare } from 'lib/functions';

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();
  let level = 5; //zero based level
  const MaxServerCount = ns.getPurchasedServerLimit();
  const PurchasedServerMaxRam = ns.getPurchasedServerMaxRam();

  const levels = Array.from({ length: Math.log2(PurchasedServerMaxRam) }, (_, i) => Math.pow(2, i + 1));

  //figure out starting level
  if (ns.args.length > 0) {
    level = (ns.args[0] as number);
  }


  let serverNames = ns.getPurchasedServers();
  serverNames.sort((a, b) => compare(a, b));
  let servers = serverNames.map(s => ns.getServer(s));
  servers.forEach(server =>
    ns.print(ns.sprintf("%s - Level %d (%s)", server.hostname, Math.log2(server.maxRam) - 1, ns.formatRam(server.maxRam)))
  )
  while (minimumServerLevel(servers) < levels.length - 1) {
    //get upgrade/purchase costs per level
    const actionCosts = levels.map((m) =>
      Array.from({ length: MaxServerCount }, (_, i) =>
        i < servers.length
          ? (servers[i].maxRam < m ? ns.getPurchasedServerUpgradeCost(servers[i].hostname, m) : 0)
          : (ns.getPurchasedServerCost(m))));
    //console.debug(actionCosts);
    const upgradeCosts = actionCosts.map(c => c.reduce((sum, current) => sum + current, 0));
    const cheapestUpgrades = actionCosts.map(c => c.findIndex(d => d > 0))
    const firstUnaffordableLevel = upgradeCosts.findIndex(l => l > ns.getServerMoneyAvailable("home"))
    if (firstUnaffordableLevel < 0) {
      level = levels.length - 1;
    }
    else {
      level = Math.max(firstUnaffordableLevel - 1, servers.length < MaxServerCount ? level : minimumServerLevel(servers) + 1, level);
    }
    //console.debug(`server level ${level}, firstUnaffordable: ${firstUnaffordableLevel}, minimumServerLevel:${minimumServerLevel(servers)}`)
    //console.debug(servers);
    const targetIndex = cheapestUpgrades[level]
    while (actionCosts[level][targetIndex] > ns.getServerMoneyAvailable("home")) {
      await ns.sleep(1000)
    }
    if (actionCosts[level][targetIndex] < ns.getServerMoneyAvailable("home")) {
      if (targetIndex < servers.length) {
        ns.print(`Upgrading ${servers[targetIndex].hostname} to ${ns.formatRam(levels[level])}`);
        ns.upgradePurchasedServer(servers[targetIndex].hostname, levels[level])
      } else {
        const snum = (targetIndex + 1).toString().length == 1 ? '0' + (targetIndex + 1).toString() : (targetIndex + 1).toString();
        ns.print(`Buying server pserv-${snum} with ${ns.formatRam(levels[level])}`)
        ns.purchaseServer(`pserv-${snum}`, levels[level])
      }
    }
    await ns.sleep(10);
    serverNames = ns.getPurchasedServers()
    serverNames.sort((a, b) => compare(a, b));
    servers = serverNames.map(s => ns.getServer(s));
  }


  function minimumServerLevel(servers: Server[]): number {
    if (servers.length == 0) return 0;
    return Math.log2(servers.reduce((prev, curr) => prev.maxRam < curr.maxRam ? prev : curr).maxRam) - 1;

  }
}