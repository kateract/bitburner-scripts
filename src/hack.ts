import { NS } from '@ns'
import { Port } from '/ports';

export async function main(ns : NS) : Promise<void> {
	const log = ns.getPortHandle(Port.HACK_LOG)
	const money = await ns.hack(ns.args[0].toString());
	log.write(ns.sprintf('Hack gained $%9s(%5s) from %s', ns.formatNumber(money), ns.formatPercent(money/ns.getServerMaxMoney(ns.args[0].toString())),  ns.args[0]));
	//console.log(ns.getHostname(),ns.sprintf('Hack gained $%9s(%5s) from %s', ns.formatNumber(money), ns.formatPercent(money/ns.getServerMaxMoney(ns.args[0].toString())),  ns.args[0]))
} 