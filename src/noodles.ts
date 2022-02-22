import { NS } from '@ns'

/** @param {NS} ns **/
export async function main(ns: NS): void {
	const target = ns.args[0];
	const moneyThresh = ns.getServerMaxMoney(target) * 0.75;
	const securityThresh = ns.getServerMinSecurityLevel(target) + 5;
	while (true) {
		if (ns.getServerSecurityLevel(target) > securityThresh) {
			await ns.weaken(target);
		}
		else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
			await ns.grow(target);
		}
		else {
			await ns.hack(target);
		}
	}
}