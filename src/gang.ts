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
      if(gang.isHacking)
      {
        g.setMemberTask(names[index], "Train Hacking");
      }
      else{
        g.setMemberTask(names[index], "Train Combat");
      }
      members = g.getMemberNames()
      
    }
    members.forEach(m => {
      const info = g.getMemberInformation(m);
      ns.formulas.gang.wantedLevelGain(gang, info, g.getTaskStats(info.task))
    })
    await ns.sleep(1000)
  }
}