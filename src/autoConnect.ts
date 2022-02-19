import { NS } from '@ns'
import { find } from '/tree';
import { IAutocompleteData } from './IAutocompleteData';

export async function main(ns : NS) : Promise<void> {
  const target = ns.args[0] as string;
  const connections = find(ns, ns.getHostname(), "", target)
  for (let i = 0; i < connections.length; i++) {
    ns.connect(connections[i]);
  }
}

export function autocomplete(data: IAutocompleteData, args : string[]) : string[] {
  return [...data.servers]
}