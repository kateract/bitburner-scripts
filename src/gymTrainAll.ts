import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  const targetAmount = (ns.args.length > 0 && !isNaN(ns.args[0] as number)) ? ns.args[0] as number : 850;
  ns.disableLog("sleep");
  ns.clearLog();
  ns.tail();
  const player = ns.getPlayer();
  ns.singularity.stopAction();
  if (ns.getPlayer().skills.agility < targetAmount) {
    ns.singularity.gymWorkout("powerhouse gym", "agility", false);
    while (ns.getPlayer().skills.agility < targetAmount) {
      await ns.sleep(5000);
    }
    ns.singularity.stopAction();
  }
  if (ns.getPlayer().skills.dexterity < targetAmount) {
    ns.singularity.gymWorkout("powerhouse gym", "dexterity", false);
    while (ns.getPlayer().skills.dexterity < targetAmount) {
      await ns.sleep(5000);
    }
    ns.singularity.stopAction();
  }
  if (ns.getPlayer().skills.defense < targetAmount) {
    ns.singularity.gymWorkout("powerhouse gym", "defense", false);
    while (ns.getPlayer().skills.defense < targetAmount) {
      await ns.sleep(5000);
    }
    ns.singularity.stopAction();
  }
  if (ns.getPlayer().skills.strength < targetAmount) {
    ns.singularity.gymWorkout("powerhouse gym", "strength", false);
    while (ns.getPlayer().skills.strength < targetAmount) {
      await ns.sleep(5000);
    }
    ns.singularity.stopAction();
  }
}

async function waitUntilNotBusy(ns: NS) : Promise<void> {
  while(ns.singularity.isBusy()) {
    await ns.sleep(1000);
  }
}