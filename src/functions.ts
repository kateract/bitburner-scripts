/* eslint-disable no-fallthrough */
import { NS } from '@ns';
import { ServerInfo } from './ServerInfo'

/** @param {NS} ns **/
export async function explore(ns: NS, server: string, oldServer = "", list = []): ServerInfo[] {
	ns.tprintf("Exploring Server: %s", server);
	const res = ns.scan(server);
	const servers = res
		.filter(f => f != oldServer)
		.map(f => getServerInfo(ns, f));
	await servers.forEach(async s => {
		if (!list.find(l => l.server === s.server)) {
			list.push(s);
		}
		await explore(ns, s.server, server, list);
	});
	return list;
}

/** @param {NS} ns **/
export function getServerInfo(ns: NS, host: string): ServerInfo {

	const purchased = ns.getPurchasedServers();

	return {
		server: host,
		admin: ns.hasRootAccess(host),
		hackLevel: ns.getServerRequiredHackingLevel(host),
		rootPorts: ns.getServerNumPortsRequired(host),
		securityLevel: ns.getServerSecurityLevel(host),
		minSecurityLevel: ns.getServerMinSecurityLevel(host),
		growthFactor: ns.getServerGrowth(host),
		money: ns.getServerMoneyAvailable(host),
		maxMoney: ns.getServerMaxMoney(host),
		ram: ns.getServerMaxRam(host),
		purchased: purchased.includes(host),
	};
}

/** @param {NS} ns **/

export function printServerInfo(ns: NS, serverInfo: ServerInfo): void {
	{
		ns.tprintf("Server: %s %s\n  Hacking Level: %-1d %s\n  Ports Req: %-1d %s\n  Security level: %0.3f(%0.3f)\n  Money: %s/%s\n  Growth: %0.3f\n  RAM: %0.2f",
			serverInfo.server,
			serverInfo.admin ? "ADMIN" : "",
			serverInfo.hackLevel,
			isHackable(ns, serverInfo) ? "HACKABLE" : "",
			serverInfo.rootPorts,
			isRootable(ns, serverInfo) ? "ROOTABLE" : "",
			serverInfo.securityLevel,
			serverInfo.minSecurityLevel,
			ns.nFormat(serverInfo.money, "0.0a"),
			ns.nFormat(serverInfo.maxMoney, "0.0a"),
			serverInfo.growthFactor,
			serverInfo.ram);
	}
}

/** @param {NS} ns **/

export function isHackable(ns: NS, serverInfo: ServerInfo): boolean {
	return serverInfo.maxMoney > 0 && serverInfo.hackLevel <= ns.getHackingLevel() && serverInfo.admin
}

/** @param {NS} ns **/

export function isRootable(ns: NS, serverInfo: ServerInfo): boolean {
	if (serverInfo.admin) {
		return false;
	}
	let portAttacks = 0;
	portAttacks += ns.fileExists("BruteSSH.exe") ? 1 : 0;
	portAttacks += ns.fileExists("FTPCrack.exe") ? 1 : 0;
	portAttacks += ns.fileExists("relaySMTP.exe") ? 1 : 0;
	portAttacks += ns.fileExists("HTTPWorm.exe") ? 1 : 0;
	portAttacks += ns.fileExists("SQLInject.exe") ? 1 : 0;
	return portAttacks >= serverInfo.rootPorts;
}


/** @param {NS} ns **/
export function killProcesses(ns: NS, serverInfo: ServerInfo): void {
	if (!serverInfo.admin) return false;
	ns.tprintf("killing processes on %s", serverInfo.server);
	const procs = ns.ps(serverInfo.server);
	procs.forEach(p => ns.kill(p.filename, serverInfo.server, p.args[0]));
}

/** @param {NS} ns **/
export function rootServer(ns: NS, serverInfo: ServerInfo): boolean {
	if (!isRootable(ns, serverInfo)) {
		return false;
	}
	switch (serverInfo.rootPorts) {
		case 5:
		case 4:
		case 3:
		case 2:
			if (ns.fileExists("FTPCrack.exe")) ns.ftpcrack(serverInfo.server);
			if (ns.fileExists("SQLInject.exe")) ns.sqlinject(serverInfo.server);
			if (ns.fileExists("relaySMTP.exe")) ns.relaysmtp(serverInfo.server);
			if (ns.fileExists("HTTPWorm.exe")) ns.httpworm(serverInfo.server);
		case 1:
			ns.brutessh(serverInfo.server);
		case 0:
			ns.nuke(serverInfo.server);
			return true;
		default:
			return false;

	}
}

/** @param {NS} ns **/
/** @param {ServerInfo} serverInfo **/
export async function populateServer(ns: NS, serverInfo: ServerInfo): boolean {
	if (!serverInfo.admin) {
		ns.tprintf("tried to populate non-admin server %s", serverInfo.server);
		return false;
	}
	await ns.scp('hack.js', "home", serverInfo.server);
	await ns.scp('weaken.js', "home", serverInfo.server);
	await ns.scp('grow.js', "home", serverInfo.server);
}

/** @param {NS} ns **/
export function analyzeTarget(ns: NS, serverInfo: ServerInfo): void {
	const hackTime = ns.getHackTime(serverInfo.server);
	const growTime = ns.getGrowTime(serverInfo.server);
	const weakenTime = ns.getWeakenTime(serverInfo.server);
	const weakenEffect = ns.weakenAnalyze();
  ns.tprintf("%0.00f,%0.00f,%0.00f,%0.00f", hackTime,growTime,weakenTime,weakenEffect)
}

/** @param {NS} ns **/
export function macaroni(ns: NS, serverInfo: ServerInfo, target: string, hackRatio:number, weakenRatio: number, growRatio: number): void {
	const memory = serverInfo.ram * .98;
	const total = hackRatio + weakenRatio + growRatio;
	const instances = (memory / 1.75) 
	ns.tprintf("memory %d; instances %d; calcmem %d", memory, instances, instances * 1.75);
	const threads = [0, 0, 0]
	for (let i = 0; i < instances; i++) {
		const select = (Math.random() * total) - hackRatio
		if (select < 0) {
			threads[0] += 1;
		} else if (select > weakenRatio) {
			threads[2] += 1;
		}
		else {
			threads[1] += 1;
		}
	}
	if (threads[0] > 0) {
		ns.exec("hack.js", serverInfo.server, threads[0], target)
	}
	if (threads[1] > 0) {
		ns.exec("weaken.js", serverInfo.server, threads[1], target)
	}
	if (threads[2] > 0) {
		ns.exec("grow.js", serverInfo.server, threads[2], target)
	}
}