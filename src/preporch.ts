import { NS } from '@ns'
import { explore, isHackable, populateServer, compare } from '/functions'

export async function main(ns : NS) : Promise<void> {
  const scriptCost = 1.8;
  const servers = await explore(ns, "home");
  const purchasedServers = servers.filter(s => s.ram > scriptCost && s.isPurchased).sort((a, b) => compare(a.ram, b.ram, true));
  const threadLimits = purchasedServers.map(s => Math.floor(s.ram / scriptCost));
  let totalThreads = 0;
  const targetServers = servers.filter(s => isHackable(ns, s));
  targetServers.sort((a, b) => compare(a.hackLevel, b.hackLevel, true))
  
  for (let i = 0; i < purchasedServers.length; i++) {
    ns.tprintf("Server: %s  Threads: %d  Target: %s", purchasedServers[i].hostname, threadLimits[i], targetServers[i]?.hostname);
    await populateServer(ns, purchasedServers[i]);
    totalThreads += threadLimits[i];
  }
  ns.tprintf("Total Threads available: %d", totalThreads)
  
}