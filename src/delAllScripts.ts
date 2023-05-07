import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  const files = ns.ls(ns.getHostname(), ".js")
  ns.tprint(files)
  files.forEach(f => ns.rm(f));
}