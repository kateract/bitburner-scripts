import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  ns.scriptKill(ns.args[0].toString(), ns.getHostname());
}