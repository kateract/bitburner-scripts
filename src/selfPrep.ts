import { NS } from '@ns'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
	const target = ns.args[0] as string;
	const minSecurityLevel = ns.args[1] as number;
	const maxMoney = ns.args[2] as number;
	const threads = ns.args[3] as number;
	while (true) {
		while (ns.ps(target).length > 0)
		{
			await ns.sleep(1000);
		}
		if (ns.getServerSecurityLevel(target) > minSecurityLevel) {
			ns.exec("weaken.js", target, threads, target )
			await ns.sleep(ns.getWeakenTime(target));
		}
		else if (ns.getServerMoneyAvailable(target) < maxMoney) {
			ns.exec("grow.js", target, threads, target )
			await ns.sleep(ns.getGrowTime(target));
		}
		else {
      ns.tprintf("Server %s self prepared.", target)
      ns.exit();
		}

	}
}