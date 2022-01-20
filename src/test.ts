import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  ns.tprint(ns.nFormat(1, "00"));
  ns.getServer( "home");
}