import { NS, Server } from '@ns'
import { explore } from '/explore'
import { batchHWGW, compare } from 'lib/functions';
import { OrchestratedServer, Process } from '/orchestratedServer';
import { ProcessTiming } from '/ProcessTiming';
import { ThreadRatios } from '/ThreadRatios';

export async function main(ns : NS) : Promise<void> {
  ns.disableLog("ALL")
  ns.tail();

  const servers: OrchestratedServer[] = [];
  const commitments: Commitment[] = [];
  const targets: TargetServer[] = [];
  const nextCommitmentId = 1;
  
  while (true)
  {
    //collect servers
    const exploredServers = await explore(ns, "home");
    
    const newServers = addNewServers(exploredServers, servers, ns);
    servers.push(...newServers);
    const newTargets = newServers.filter(s => s.moneyMax > 0).map(s => new TargetServer(ns, s));
    targets.push(...newTargets)
    targets.sort((a, b) => compare(getMoneyPerSecond(ns, a.server), getMoneyPerSecond(ns, b.server), true));
    const totalRam = servers.reduce((p,c) => p + c.maxRam, 0);
    const freeRam = commitments.reduce((p, c) => p - c.ramCost, totalRam);
    


    await ns.asleep(1000);
  }
  
}

class Commitment {
  constructor(
    public id: number,
    public against: string, 
    public target: string, 
    public ramCost: number, 
    public process: Process
  ){

  }
}

class TargetServer {
  constructor(ns: NS, public server: OrchestratedServer) {
    
  }
  public batches: ProcessTiming[] = [];

}

function addNewServers(exploredServers: Server[], servers: OrchestratedServer[], ns: NS): OrchestratedServer[] {
  const newServers: OrchestratedServer[] = []
  if (exploredServers.length > servers.length) {
    const serverNames: string[] = servers.map(s => s.hostname);
    for (const s of exploredServers) {
      if (!serverNames.includes(s.hostname)) {
        newServers.push(new OrchestratedServer(ns, s));
      }
    }
  }
  return newServers;
}


function getMoneyPerSecond(ns: NS, server: Server) {
  const player = ns.getPlayer()
  const tserver = ns.getServer(server.hostname);
  tserver.moneyAvailable = tserver.moneyMax
  tserver.hackDifficulty = tserver.minDifficulty
  return (tserver.moneyMax * .9) / ns.formulas.hacking.weakenTime(tserver, player) * 1000 * ns.formulas.hacking.hackChance(tserver, player);
}

