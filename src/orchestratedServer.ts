import { NS, Server } from '@ns'

export class OrchestratedServer implements Server {
  
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
    portAttacks += this.ns.fileExists("BruteSSH.exe") ? 1 : 0;
    portAttacks += this.ns.fileExists("FTPCrack.exe") ? 1 : 0;
    portAttacks += this.ns.fileExists("relaySMTP.exe") ? 1 : 0;
    portAttacks += this.ns.fileExists("HTTPWorm.exe") ? 1 : 0;
    portAttacks += this.ns.fileExists("SQLInject.exe") ? 1 : 0;
    return portAttacks >= this.numOpenPortsRequired ? RootStatus.ROOTABLE : RootStatus.NOT_ROOTABLE
  }

  get IsHackable() : boolean {
    return this.moneyMax > 0 && this.requiredHackingSkill <= this.ns.getHackingLevel() && this.hasAdminRights
  }

  CurrentTarget =  "NONE";

  cpuCores = 0;

  /** Flag indicating whether the FTP port is open */
  ftpPortOpen = false;

  /** Flag indicating whether player has admin/root access to this server */
  hasAdminRights = false;

  /** Hostname. Must be unique */
  hostname = "";

  /** Flag indicating whether HTTP Port is open */
  httpPortOpen = false;

  /** IP Address. Must be unique */
  ip= "";

  /** Flag indicating whether player is curently connected to this server */
  isConnectedTo = false;

  /** RAM (GB) available on this server */
  maxRam = 0;

  /**
   * Name of company/faction/etc. that this server belongs to.
   * Optional, not applicable to all Servers
   */
  organizationName = "";

  /** RAM (GB) used. i.e. unavailable RAM */
  ramUsed = 0;

  /** Flag indicating whether SMTP Port is open */
  smtpPortOpen = false;

  /** Flag indicating whether SQL Port is open */
  sqlPortOpen = false;

  /** Flag indicating whether the SSH Port is open */
  sshPortOpen = false;

  /** Flag indicating whether this is a purchased server */
  purchasedByPlayer = false;

  /** Flag indicating whether this server has a backdoor installed by a player */
  backdoorInstalled = false;

  /**
   * Initial server security level
   * (i.e. security level when the server was created)
   */
  baseDifficulty = 0;

  /** Server Security Level */
  hackDifficulty = 0;

  /** Minimum server security level that this server can be weakened to */
  minDifficulty = 0;

  /** How much money currently resides on the server and can be hacked */
  moneyAvailable = 0;

  /** Maximum amount of money that this server can hold */
  moneyMax = 0;

  /** Number of open ports required in order to gain admin/root access */
  numOpenPortsRequired = 0;

  /** How many ports are currently opened on the server */
  openPortCount = 0;

  /** Hacking level required to hack this server */
  requiredHackingSkill = 0;

  /**
   * Parameter that affects how effectively this server's money can
   * be increased using the grow() Netscript function
   */
  serverGrowth = 0;
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
