import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  const targetAmount = (ns.args.length > 0 && !isNaN(ns.args[0] as number)) ? ns.args[0] as number : 850;
  ns.disableLog("sleep");
  ns.clearLog();
  ns.tail();
  const player = ns.getPlayer();
  ns.stopAction();
  if (ns.getPlayer().agility < targetAmount) {
    ns.gymWorkout("powerhouse gym", "agility", false);
    while (ns.getPlayer().agility < targetAmount) {
      await ns.sleep(5000);
    }
    ns.stopAction();
  }
  if (ns.getPlayer().dexterity < targetAmount) {
    ns.gymWorkout("powerhouse gym", "dexterity", false);
    while (ns.getPlayer().dexterity < targetAmount) {
      await ns.sleep(5000);
    }
    ns.stopAction();
  }
  if (ns.getPlayer().defense < targetAmount) {
    ns.gymWorkout("powerhouse gym", "defense", false);
    while (ns.getPlayer().defense < targetAmount) {
      await ns.sleep(5000);
    }
    ns.stopAction();
  }
  if (ns.getPlayer().strength < targetAmount) {
    ns.gymWorkout("powerhouse gym", "strength", false);
    while (ns.getPlayer().strength < targetAmount) {
      await ns.sleep(5000);
    }
    ns.stopAction();
  }
}

async function waitUntilNotBusy(ns: NS) : Promise<void> {
  while(ns.isBusy()) {
    await ns.sleep(1000);
  }
}