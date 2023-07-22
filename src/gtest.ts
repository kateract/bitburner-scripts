import { NS } from '@ns';

export async function main(ns: NS) {
  ns.gang.getMemberNames().map(n => [n, ns.gang.getAscensionResult(n)]).forEach(r => console.log(r));
}