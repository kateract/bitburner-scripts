import { NS } from '@ns'
import { Port } from '/ports';

export async function main(ns : NS) : Promise<void> {
	const log = ns.getPortHandle(Port.HACK_LOG)
	const money = await ns.hack(ns.args[0].toString());
	log.write(ns.sprintf('Hack gained %9s from %s', ns.nFormat(money, "$##0.000a"), ns.args[0]));
} 