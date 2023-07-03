import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  const names = ["Manny", "Joey", "Rocky", "Billy", "Vinny", "Harry", "Nicky", "Paulie", "Charlie", "Rodney", "Sully", "Sonny", "Donny", "Bobby", "Chucky"]
  const g = ns.gang;
  while (g.inGang()) {
    const gang = g.getGangInformation();
    let members = g.getMemberNames()

    if (g.canRecruitMember()) {
      const index = members.length
      g.recruitMember(names[index]);
      if (gang.isHacking) {
        g.setMemberTask(names[index], "Train Hacking");
      }
      else {
        g.setMemberTask(names[index], "Train Combat");
      }
      members = g.getMemberNames()
    }
    members.forEach(m => {
      const info = g.getMemberInformation(m);
      let avgExp = 0;
      if (gang.isHacking) (avgExp = info.hack_exp)
      else {
        avgExp = [info.str_exp, info.def_exp, info.dex_exp, info.agi_exp].reduce((pre, cur) => pre + cur, 0)/4
      }
      if (avgExp > 1000001) {
        g.ascendMember(m);
        buyAllAffordableEquipmentForMember(ns, m);
      }

    })
    await ns.sleep(1000)
  }
}

export function buyAllAffordableEquipmentForMember(ns: NS, memberName: string)
{
  const g = ns.gang;
  const member = g.getMemberInformation(memberName);
  const eq = g.getEquipmentNames().filter(e => !member.upgrades.includes(e)).filter(e => !member.augmentations.includes(e));
  while(eq.length > 0 && ns.getServerMoneyAvailable('home') > g.getEquipmentCost(eq[0])){
    g.purchaseEquipment(memberName, eq.shift() as string);
  }
  
}
