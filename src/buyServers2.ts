import { NS, ProcessInfo } from '@ns'

import { killProcesses, populateServer, compare } from './functions';

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
	const limit = ns.getPurchasedServerLimit();
	const serverNames = ns.getPurchasedServers()
	const servers = serverNames.map(s => ns.getServer( s));
	servers.sort((a, b) => compare(a.hostname, b.hostname));
	const levels = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576]
	const memory = servers.map(s => levels.indexOf(ns.getServerMaxRam(s.hostname)));
	for (let i = 0; i < servers.length; i++ ) {
		ns.tprintf("%s - Level %d (%s)", servers[i].hostname, memory[i], levels[memory[i]] )
	}
	let level = 9
	let index = 0
	if (servers.length < limit) {
		index = servers.length;
	} else {
		level = Math.min(...memory) + 1;
	} 
	for (level; level < levels.length; level++) {
		ns.tprintf("starting level %-d of %-d", level, levels.length)
		//ns.tprint(level)
		const cost = ns.getPurchasedServerCost(levels[level]);
		if ((ns.getServerMoneyAvailable("home") * .75 / 25) > cost) {
			ns.tprintf("Server cost for %s too low (%s), trying %s in 10 seconds", ns.nFormat(levels[level]*1e+9, "0.000 b"), ns.nFormat(cost, "$ 0.00 a"), ns.nFormat(levels[level + 1]*1e+9, "0.000 ib"));
			await ns.sleep(10000);
			continue;
		}
		for (index; index < limit; index++) {
			const server = index < servers.length ? servers[index] : null;
			const host = server ? server.hostname : "pserv-" + ns.nFormat(index, "00"); 
			
			let ps: ProcessInfo[] = []
			//wait until you have enough money
			while (cost > ns.getServerMoneyAvailable("home")/2) {
				await ns.sleep(2 * 60 * 1000);
			}

			if (server) {
				if (memory[index] >= level) {
					ns.tprintf("Skipping Server %s this level.", server.hostname)
					continue;
				} 
				ns.tprintf("Upgrading Server %s to %s ram", server.hostname, ns.nFormat(levels[level]*1e+9, "0.000 b"));
				ps = ns.ps(server.hostname);
        killProcesses(ns, server);
				ns.deleteServer(server.hostname);
			}
			else {
				ns.tprintf("Buying Server %s", host);
				memory[index] = level;
			}
			ns.purchaseServer(host, levels[level])
			servers[index] = ns.getServer( host);
			await populateServer(ns, host);

			if (ps.length > 0){
				const proc = ns.ps().find(p => p.filename == "dispatcher.js" && p.args[0] == host)
				if (proc) {
					ns.kill(proc.pid)
					ns.exec("dispatcher.js", "home", 1, ...proc.args);
				}
			}
			await ns.sleep(1000);
		}
		index = 0;
	}
}