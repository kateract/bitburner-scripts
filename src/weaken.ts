import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  const target = ns.args[0].toString();
  await ns.weaken(target);
  //console.log(ns.getHostname(),ns.sprintf('weakened %s', ns.args[0]))
}