import { NS, Server } from '@ns'
import { compare, isHackable, isRootable, rootServer, populateServer, killProcesses } from "/functions.js"
import { printServerInfo } from "/visualize"


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
				await populateServer(ns, s);
				// if (ns.ps(s.hostname).length == 0 && isHackable(ns, s) && s.maxRam > 0) {
				// 	const threads = Math.floor(s.maxRam / ns.getScriptRam("weaken.js"));
				// 	ns.exec("prepareServer.js", "home", 1, s.hostname, s.hostname, threads);
				// }

				await ns.sleep(200);
			}
		}
		else {
			if (s.hasAdminRights) await populateServer(ns, s);
			await ns.sleep(200);
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
