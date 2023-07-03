import { NS } from "@ns";
import { buyAllAffordableEquipmentForMember } from "./gang";

export async function main(ns: NS) {
  ns.clearLog();
  ns.tail();
  ns.gang.getMemberNames().forEach(m =>{
    buyAllAffordableEquipmentForMember(ns, m);
    ns.print(m);
  });
}