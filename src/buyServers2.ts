import { NS, ProcessInfo } from '@ns'

import { killProcesses, populateServer, compare, GB_MULT } from '/functions';
import { maximize } from '/ratios';

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL")
	ns.tail()

	const limit = ns.getPurchasedServerLimit();
	const serverNames = ns.getPurchasedServers()
	const servers = serverNames.map(s => ns.getServer( s));
	servers.sort((a, b) => compare(a.hostname, b.hostname));
	const levels = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576]
	const memory = servers.map(s => levels.indexOf(ns.getServerMaxRam(s.hostname)));
	for (let i = 0; i < servers.length; i++ ) {
		ns.print(ns.sprintf("%s - Level %d (%s)", servers[i].hostname, memory[i] + 1 , levels[memory[i]] ))
	}
	let level = 5
	let index = 0
	if (servers.length < limit) {
		index = servers.length;
	} else {
		level = Math.min(...memory) + 1;
	} 
	for (level; level < levels.length; level++) {
		ns.print(ns.sprintf("starting level %-d of %-d", level + 1, levels.length))
		//ns.tprint(level)
		const cost = ns.getPurchasedServerCost(levels[level]);
		if ((ns.getServerMoneyAvailable("home") * .75 / 25) > cost && level < 19) {
			ns.print(ns.sprintf("Server cost for %s too low (%s), trying %s in 5 seconds", ns.nFormat(levels[level]*GB_MULT, "0.000 ib"), ns.nFormat(cost, "$ 0.00 a"), ns.nFormat(levels[level + 1]*GB_MULT, "0.000 ib")));
			await ns.sleep(5000);
			continue;
		}
		for (index; index < limit; index++) {
			const server = index < servers.length ? servers[index] : null;
			const host = server ? server.hostname : "pserv-" + ns.nFormat(index, "00"); 
			
			let ps: ProcessInfo[] = []
			//wait until you have enough money
			while (cost > ns.getServerMoneyAvailable("home")/2) {
				await ns.sleep(30 * 1000);
			}

			if (server) {
				if (memory[index] >= level) {
					ns.print(ns.sprintf("Skipping Server %s this level.", server.hostname))
					continue;
				} 
				ns.print(ns.sprintf("Upgrading Server %s to %s ram", server.hostname, ns.nFormat(levels[level]*GB_MULT, "0.000 ib")));
				ps = ns.ps(server.hostname);
				let dead = false;
				while(!dead) {
					killProcesses(ns, server);
					dead = ns.deleteServer(server.hostname);
					if(!dead) await ns.sleep(100);
				}
			}
			else {
				ns.print(ns.sprintf("Buying Server %s", host));
				memory[index] = level;
			}
			ns.purchaseServer(host, levels[level])
			servers[index] = ns.getServer( host);
			await populateServer(ns, host);

			if (ps.length > 0){
				let proc = ns.ps().find(p => p.filename == "dispatcher.js" && p.args[0] == host)
				if (proc) {
					ns.kill(proc.pid)
					const newRatios = await maximize(ns, servers[index], (Math.floor(servers[index].maxRam/1.75)));
					ns.exec("dispatcher.js", "home", 1, proc.args[0], proc.args[1], newRatios.hackThreads);
				}
				proc = ns.ps().find(p => p.filename == "dispatcher2.js" && p.args[0] == host)
				if (proc) {
					ns.kill(proc.pid)
					ns.exec("dispatcher2.js", "home", 1, proc.args[0], proc.args[1]);
				}
				proc = ns.ps().find(p => p.filename === "prepareServer.js" && p.args[1] == host)
				if (proc) {
					ns.kill(proc.pid)
					ns.exec("prepareServer.js", "home", 1, proc.args[0], proc.args[1], Math.floor(servers[index].maxRam/1.75));
				}
			}
			await ns.sleep(1000);
		}
		index = 0;
	}
}