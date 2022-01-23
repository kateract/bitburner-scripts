import { NS, Server } from '@ns'
import { isRootable, isHackable } from '/lib/functions';


export function printServerInfo(ns: NS, serverInfo: Server, rank = 0): void {
  {
    ns.tprintf("%sServer: %s %s\n  Hacking Level: %-1d %s\n  Ports Req: %-1d %s\n  Security level: %0.3f(%0.3f)\n  Money: %s/%s\n  Growth: %0.3f\n  RAM: %0.2f",
      rank > 0 ? `#${ns.nFormat(rank, "00")} ` : "",
      serverInfo.hostname,
      serverInfo.hasAdminRights ? "ADMIN" : "",
      serverInfo.requiredHackingSkill,
      isHackable(ns, serverInfo) ? "HACKABLE" : "",
      serverInfo.numOpenPortsRequired,
      isRootable(ns, serverInfo) ? "ROOTABLE" : "",
      serverInfo.hackDifficulty,
      serverInfo.minDifficulty,
      ns.nFormat(serverInfo.moneyAvailable, "0.0a"),
      ns.nFormat(serverInfo.moneyMax, "0.0a"),
      serverInfo.serverGrowth,
      serverInfo.maxRam);
  }
}

export function printServerSummary(ns: NS, serverInfo: Server): void {
  ns.tprintf("%20s: Money - %10s(%10s)  |  Security - %8s(%8s)", serverInfo.hostname, ns.nFormat(serverInfo.moneyAvailable, "$0.000 a"), ns.nFormat(serverInfo.moneyMax, "$0.000 a"), ns.nFormat(serverInfo.hackDifficulty, "0.000"), ns.nFormat(serverInfo.minDifficulty, "0.000"))
}
