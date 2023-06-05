import { NS } from '@ns'
import { isHackable, populateServer, compare } from 'lib/functions'
import { explore } from '/explore'

export async function main(ns : NS) : Promise<void> {
  const scriptCost = 1.8;
  const servers = await explore(ns, "home");
  const purchasedServers = servers.filter(s => s.maxRam > scriptCost && s.purchasedByPlayer).sort((a, b) => compare(a.maxRam, b.maxRam, true));
  const threadLimits = purchasedServers.map(s => Math.floor(s.maxRam / scriptCost));
  let totalThreads = 0;
  const targetServers = servers.filter(s => isHackable(ns, s));
  targetServers.sort((a, b) => compare(a.requiredHackingSkill!, b.requiredHackingSkill!, true))
  
  for (let i = 0; i < purchasedServers.length; i++) {
    ns.tprintf("Server: %s  Threads: %d  Target: %s", purchasedServers[i].hostname, threadLimits[i], targetServers[i]?.hostname);
    await populateServer(ns, purchasedServers[i]);
    totalThreads += threadLimits[i];
  }
  ns.tprintf("Total Threads available: %d", totalThreads)
  
}