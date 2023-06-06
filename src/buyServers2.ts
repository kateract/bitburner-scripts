import { NS, ProcessInfo, Server } from '@ns'

import { killProcesses, populateServer, compare, GB_MULT } from 'lib/functions';
import { maximize } from '/ratios';

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
	ns.disableLog("ALL")
	ns.tail()
	let level = 5 //zero based level
	const Multipliers = ns.getBitNodeMultipliers()
	const MaxServerCount = ns.getPurchasedServerLimit();
	const serverNames = ns.getPurchasedServers()
	const servers = serverNames.map(s => ns.getServer( s));
	servers.sort((a, b) => compare(a.hostname, b.hostname));
	const levels = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576].filter(s => s < ns.getPurchasedServerMaxRam());
	
	const memory = servers.map(s => levels.indexOf(ns.getServerMaxRam(s.hostname)));
	if(ns.args.length > 0){
		level = (ns.args[0] as number) - 1;
	} else {
		while ((ns.getServerMoneyAvailable("home") / MaxServerCount) > ns.getPurchasedServerCost(levels[level]) && level <= (levels.length - 1))
		{
			level++;
		}
		if (level > 0) level--;
	}
	for (let i = 0; i < servers.length; i++ ) {
		ns.print(ns.sprintf("%s - Level %d (%s)", servers[i].hostname, memory[i] + 1 , levels[memory[i]] ))
	}
	let index = 0
	if (servers.length < MaxServerCount) {
		index = servers.length;
	} else {
		level = Math.min(...memory) + 1;
		
	} 
	for (level; level < levels.length; (servers.length == MaxServerCount && level < levels.length - 1) ? minimumServerLevel(servers) + 1 : level++) {
		//ns.tprint(level);
		//ns.tprint(servers.length); 
		const cost = ns.getPurchasedServerCost(levels[level])
		ns.print(ns.sprintf("starting level %-d of %-d", level + 1, levels.length))
		if (level < (levels.length - 1) && (ns.getServerMoneyAvailable("home") * .75 / MaxServerCount) > ns.getPurchasedServerCost(levels[level + 1])) {
			ns.print(ns.sprintf("Server cost for %s too low (%s), trying %s in 2 seconds", ns.formatRam(levels[level]), ns.formatNumber(cost), ns.formatRam(levels[level + 1])));
			await ns.sleep(2000);
			continue;
		}
		for (index; index < MaxServerCount; index++) {
			const server = index < servers.length ? servers[index] : null;
			let snum = (index + 1).toString().length == 1 ? '0' + (index + 1).toString() : (index + 1).toString();
			const host = server ? server.hostname : "pserv-" + snum; 
			
			let ps: ProcessInfo[] = [] 
			//wait until you have enough money
			while (cost > ns.getServerMoneyAvailable("home")/2) {
				await ns.sleep(30 * 1000);
			}
			let newServer = host
			if (server) {
				if (memory[index] >= level) {
					ns.print(ns.sprintf("Skipping Server %s this level.", server.hostname))
					continue;
				} 
				ns.print(ns.sprintf("Upgrading Server %s to %s ram", server.hostname, ns.formatRam(levels[level])));
				memory[index] = level;
				ns.upgradePurchasedServer(host, levels[level]);
			}
			else {
				ns.print(ns.sprintf("Buying Server %s", host));
				memory[index] = level;
				if (level < (levels.length - 2) && index < (MaxServerCount - 1) && (ns.getServerMoneyAvailable("home") * .75 / (MaxServerCount - index)) > ns.getPurchasedServerCost(levels[level + 1])) {
					level++;
					ns.print(ns.sprintf("Bumping level to %s", level + 1));
					memory[index] = level;
				}
				//ns.tprint(level)
				newServer = ns.purchaseServer(host, levels[level])
			}
			servers[index] = ns.getServer(newServer);
			await populateServer(ns, host);
			//ns.tprint(newServer);
			if (ps.length > 0){ 
				let proc = ns.ps().find(p => p.filename == "dispatcher.js" && p.args[0] == host)
				if (proc) {
					ns.kill(proc.pid)
					const newRatios = await maximize(ns, servers[index], (Math.floor(servers[index].maxRam/1.75)));
					ns.exec("dispatcher.js", "home", 1, proc.args[0], proc.args[1], newRatios.hackThreads);
				}
				proc = ns.ps().find(p => p.filename == "dispatcher2.js" && p.args[1] == host)
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
			await ns.sleep(10);
		}
		index = 0;
	}

	function minimumServerLevel(servers: Server[]) : number {
		return levels.indexOf(servers.reduce((prev, curr) => prev.maxRam < curr.maxRam ? prev : curr).maxRam) + 1;

	}
}