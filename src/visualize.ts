import { NS, Server } from '@ns'
import { isHackable } from 'lib/functions';


export function printServerInfo(ns: NS, serverInfo: Server, rank = 0): void {
  ns.tprintf(getServerInfo(ns, serverInfo, rank));
}
export function getServerInfo(ns: NS, serverInfo: Server, rank = 0): string {
  return ns.sprintf("%sServer: %s %s\n  Hacking Level: %-1d %s\n  Security level: %0.3f(%0.3f)\n  Money: %s/%s\n  RAM: %0.2f",
    rank > 0 ? `#${rank.pad(2)} ` : "",
    serverInfo.hostname,
    serverInfo.hasAdminRights ? "ADMIN" : "",
    serverInfo.requiredHackingSkill,
    isHackable(ns, serverInfo) ? "HACKABLE" : "",
    serverInfo.hackDifficulty,
    serverInfo.minDifficulty,
    ns.nFormat(serverInfo.moneyAvailable ?? 0, "0.0a"),
    ns.nFormat(serverInfo.moneyMax ?? 0, "0.0a"),
    serverInfo.maxRam);

}


export function logServerSummary(ns: NS, serverInfo: Server): void {
  ns.print(getServerSummary(ns, serverInfo))
}
export function printServerSummary(ns: NS, serverInfo: Server): void {
  ns.tprintf(getServerSummary(ns, serverInfo));
}

export function getServerSummary(ns: NS, serverInfo: Server): string {
  return ns.sprintf("%s: Money - %10s(%10s)  |  Security - %8s(%8s)", serverInfo.hostname, ns.formatNumber(serverInfo.moneyAvailable!), ns.formatNumber(serverInfo.moneyMax!), ns.formatNumber(serverInfo.hackDifficulty!), ns.formatNumber(serverInfo.minDifficulty!))
}

declare global {
  interface Number {
    pad(n: number | undefined): string;
  }
}

Number.prototype.pad = function (n: number | undefined) {
  return new Array(n).join('0').slice((n || 2) * -1) + this;
}