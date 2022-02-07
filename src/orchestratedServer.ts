import { NS, Server } from '@ns'

export class OrchestratedServer extends Server {
  
  constructor (private ns: NS, server: Server) {
    Object.assign(this, server);
  }

  get ThreadLimit(): number {
    return this.maxRam / 1.75;
  }
  CommittedThreads = 0;
  get AvailableThreads(): number {
    return this.ThreadLimit - this.CommittedThreads;
  }

  TargetStatus: Process = Process.NONE;

  get RootStatus() : RootStatus {
    if(this.hasAdminRights) return RootStatus.ROOTED;
    let portAttacks = 0;
    portAttacks += ns.fileExists("BruteSSH.exe") ? 1 : 0;
    portAttacks += ns.fileExists("FTPCrack.exe") ? 1 : 0;
    portAttacks += ns.fileExists("relaySMTP.exe") ? 1 : 0;
    portAttacks += ns.fileExists("HTTPWorm.exe") ? 1 : 0;
    portAttacks += ns.fileExists("SQLInject.exe") ? 1 : 0;
    return portAttacks >= serverInfo.numOpenPortsRequired ? RootStatus.ROOTABLE : RootStatus.NOT_ROOTABLE
  }

  get IsHackable() : boolean {
    return this.moneyMax > 0 && this.requiredHackingSkill <= ns.getHackingLevel() && this.hasAdminRights
  }

  CurrentTarget =  "NONE";

}

export enum Process {
  NONE,
  PREPARING,
  HACKING
}

export enum RootStatus {
  NOT_ROOTABLE,
  ROOTABLE,
  ROOTED
}
