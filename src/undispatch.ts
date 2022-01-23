import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  ns.scriptKill("dispatcher.js", "home");
}