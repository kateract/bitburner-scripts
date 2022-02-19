import { NS } from '@ns'
import { IAutocompleteData } from './IAutocompleteData';

export async function main(ns : NS) : Promise<void> {
  const script = ns.args[0] as string;
  const mem = ns.getScriptRam(script);
  const ram = ns.getServerMaxRam(ns.getHostname());
  const free = ram - ns.getServerUsedRam(ns.getHostname());
  ns.tprintf("%s GB - %d(%d) instances", mem, Math.floor(ram/mem), Math.floor(free/mem));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data : IAutocompleteData, args : string[]) : string[] {
  return [...data.scripts]
}