import { NS } from '@ns'

import { getServerInfo, killProcesses } from './functions.ts';

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
	const limit = ns.getPurchasedServerLimit();
	const servernames = ns.getPurchasedServers()
	const servers = servernames.map(s => getServerInfo(ns, s));
	const levels = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576]
	const memory = servers.map(s => levels.indexOf(ns.getServerMaxRam(s.server)));
	ns.tprint(memory);
	let level = 3
	let index = 0
	if (servers.length < limit) {
		index = servers.length;
	} else {
		level += Math.min(...memory);
	} 
	ns.tprintf("starting level %-d of %-d", level, levels.length)
	for (level; level < levels.length; level++) {
		ns.tprint(level)
		const cost = ns.getPurchasedServerCost(levels[level]);
		if ((ns.getServerMoneyAvailable("home") * 0.5 / 25) > cost) {
			ns.tprintf("Server cost for %s too low (%s), trying %s in 10 seconds", ns.nFormat(levels[level]*1e+9, "0.000 b"), ns.nFormat(cost, "$ 0.00 a"), ns.nFormat(levels[level + 1]*1e+9, "0.000 ib"));
			await ns.sleep(10000);
			continue;
		}
		for (index; index < limit; index++) {
			const host = "pserv-" + index;
			let ps = []
			while (cost > ns.getServerMoneyAvailable("home")) {
				await ns.sleep(2 * 60 * 1000);
			}
			if (servers.map(s => s.server).includes(host)) {
				if (memory[index] >= level) continue;
				ns.tprintf("Upgrading Server %s to %s ram", host, ns.nFormat(levels[level]*1e+9, "0.000 ib"));
				ps = ns.ps(host);
				killProcesses(ns, servers.find(s => s.server === host));
				ns.deleteServer(host);
			}
			else {
				ns.tprintf("Buying Server %s", host);
				memory[index] = level;
			}
			ns.purchaseServer(host, levels[level])
			if (ps.length > 0) {
				for (const process of ps) {
					await ns.scp(process.filename, "home", host);
					ns.exec(process.filename, host, process.threads * 2, process.args[0])
				}
			} else {
				if (ns.args[0]) {
					ns.exec("explore.js", "home", 1, ns.args[0]);
				}
			}
			await ns.sleep(1000);
		}
		index = 0;
	}
}