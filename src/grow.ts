import { NS } from '@ns'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
	await ns.grow(ns.args[0].toString());
}