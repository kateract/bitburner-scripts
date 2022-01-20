import { NS } from '@ns'
import { getServerInfo } from '/functions';

export async function main(ns : NS) : Promise<void> {
  ns.tprint(ns.nFormat(1, "00"));
  getServerInfo(ns, "home");
}