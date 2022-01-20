import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  ns.ps().filter(p => p.filename === "dispatcher.js").forEach(p => ns.kill(p.pid));
}