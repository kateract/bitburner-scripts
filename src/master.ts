import { NS } from '@ns'
import { explore } from '/explore'
import { OrchestratedServer, Process } from '/orchestratedServer';

export async function main(ns : NS) : Promise<void> {
  const servers: OrchestratedServer[] = [];
  const commitments: Commitment[] = [];
  const nextCommitmentId = 1;
  
  while (true)
  {
    //collect servers
    const exploredServers = await explore(ns, "home");
    
    const newServers = addNewServers(exploredServers, servers, ns);
    
    //


    await ns.asleep(1000);
  }
  
}

class Commitment {
  constructor(
    public id: number,
    public against: string, 
    public target: string, 
    public threads: number, 
    public process: Process
  ){

  }
}

function addNewServers(exploredServers: Server[], servers: OrchestratedServer[], ns: NS): boolean {
  if (exploredServers.length > servers.length) {
    const serverNames: string[] = servers.map(s => s.hostname);
    for (const s of exploredServers) {
      if (!serverNames.includes(s.hostname)) {

        servers.push(new OrchestratedServer(ns, s));
      }
    }
    return true;
  }
  return false;
}

