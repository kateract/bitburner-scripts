import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  const script = ns.args[0] as string;
  const mem = ns.getScriptRam(script);
  const ram = ns.getServerMaxRam(ns.getHostname());
  const free = ram - ns.getServerUsedRam(ns.getHostname());
  ns.tprintf("%s GB - %d(%d) instances", mem, Math.floor(ram/mem), Math.floor(free/mem));
}