import { NS } from '@ns'
import { explore, printServerInfo, isHackable, isRootable, rootServer, populateServer, killProcesses, macaroni, getServerInfo } from "./functions.js"


/** @param {NS} ns **/
export async function main(ns: NS): void {
	const servers = await explore(ns, 'home');
	servers.sort((a, b) => a.hackLevel - b.hackLevel)
	ns.tprintf("%-d Servers Probed", servers.length);
	ns.tprintf("%-d Hackable Servers", servers.filter(s => isHackable(ns, s)).length)
	servers.filter(s => isHackable(ns, s) && s.maxMoney > 0).forEach(s => printServerInfo(ns, s));
	ns.tprintf("%-d Rootable Servers", servers.filter(s => isRootable(ns, s)).length)
	servers.filter(s => isRootable(ns, s)).forEach(s => {
		//ns.tprint(s);
		const success = rootServer(ns, s);
		if (success) {
			ns.tprintf("Successfully rooted %s", s.server);
			s.admin = true;
		}
	});
	if (ns.args.length > 0) {
		const target = getServerInfo(ns, ns.args[0])
		const hackTime = ns.getHackTime(target.server);
		const growTime = ns.getGrowTime(target.server);
		const weakenTime = ns.getWeakenTime(target.server) * 2;
		const adminServers = servers.filter(s => s.admin)
		for (const server of adminServers) {
			await populateServer(ns, server);
			killProcesses(ns, server);
			await macaroni(ns, server, target.server, hackTime, weakenTime, growTime);
		}
	}


}