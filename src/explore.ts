import { NS, Server } from '@ns'
import { compare, isHackable, isRootable, rootServer, populateServer, killProcesses, macaroni } from "/functions.js"
import {printServerInfo} from "/visualize"


/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
	const servers = await explore(ns, 'home');
	servers.sort((a, b) => compare(a.moneyMax, b.moneyMax, true))
	let index = 1;
	servers.filter(s => isHackable(ns, s) && s.moneyMax > 0).forEach(s => printServerInfo(ns, s, index++));
	ns.tprintf("%-d Servers Probed", servers.length);
	ns.tprintf("%-d Hackable Servers", servers.filter(s => isHackable(ns, s)).length)
	ns.tprintf("%-d Rootable Servers", servers.filter(s => isRootable(ns, s)).length)
	for (const s of servers) {
		if (isRootable(ns, s)) {
			//ns.tprint(s);
			const success = rootServer(ns, s);
			if (success) {
				ns.tprintf("Successfully rooted %s", s.hostname);
				s.hasAdminRights = true;

				if (ns.ps(s.hostname).length == 0 && isHackable(ns, s)) {
					const threads = s.maxRam / ns.getScriptRam("weaken.js");
					ns.exec("noodles.js", "home", 1, s.hostname, s.minDifficulty, s.moneyMax, threads);
				}

				await ns.sleep(200);
			}
		}
		if (s.hasAdminRights) await populateServer(ns, s);
	}
	if (ns.args.length > 0) {
		const target = ns.getServer(ns.args[0].toString())
		const hackTime = ns.getHackTime(target.hostname);
		const growTime = ns.getGrowTime(target.hostname);
		const weakenTime = ns.getWeakenTime(target.hostname) * 2;
		const adminServers = servers.filter(s => s.hasAdminRights)
		for (const server of adminServers) {
			//await populateServer(ns, server);
			killProcesses(ns, server);
			await macaroni(ns, server, target.hostname, hackTime, weakenTime, growTime);
		}
	}


}

/** @param {NS} ns **/
export async function explore(ns: NS, server: string, oldServer = "", list: Server[] = []): Promise<Server[]> {
	//ns.tprintf("Exploring Server: %s", server);
	const res = ns.scan(server);
	const servers = res
		.filter(f => f != oldServer)
		.map(f => ns.getServer(f));
	await servers.forEach(async s => {
		if (!list.find(l => l.hostname === s.hostname)) {
			list.push(s);
		}
		await explore(ns, s.hostname, server, list);
	});
	return list;
}
