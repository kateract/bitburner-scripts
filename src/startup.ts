import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  ns.run("watcher.js");
  ns.run("explore.js");
}