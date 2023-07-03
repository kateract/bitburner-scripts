import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  const procs = ns.ps().map(p => p.filename);
  ns.run("explore.js");
  startProcIfNotRunning('hacknetBuilder.js');
  if (ns.gang.inGang()) {
    startProcIfNotRunning("gang.js");
  }
  if (ns.corporation.hasCorporation()){
    startProcIfNotRunning("manageCorp.js");
  }
  if (ns.getServerMaxRam('home') > 128) {
    startProcIfNotRunning('sleeve.js');
  }
  startProcIfNotRunning('sellHashes.js'); 
  startProcIfNotRunning('contractCrawler.js');

  function startProcIfNotRunning(proc:string) {
    if (!procs.includes(proc)) ns.run(proc);
  }
}

