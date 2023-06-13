import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  ns.disableLog("sleep");
  ns.clearLog();
  ns.tail();

  const nci = "nickofolas Congruity Implant";
  if (ns.singularity.isBusy()) {
    ns.print("Waiting for player to not be busy");
  }
  while(ns.singularity.isBusy()) {
    await ns.sleep(1000);
  }
  let grafts = getAugmentList(ns);
  if (grafts.includes(nci)){
    while(ns.getServerMoneyAvailable('home') < ns.grafting.getAugmentationGraftPrice(nci)){
      await ns.sleep(1000);
    }
    ns.grafting.graftAugmentation(nci);
    await ns.sleep(ns.grafting.getAugmentationGraftTime(nci));
    grafts = getAugmentList(ns);
  }
  let index = 0
  while(grafts.length > 0)
  {
    const aug = grafts[index]
    while(ns.singularity.isBusy()) {
      await ns.sleep(1000);
    }
    const started = ns.grafting.graftAugmentation(aug, ns.singularity.isFocused())
    if (started) {
      await ns.sleep(ns.grafting.getAugmentationGraftTime(aug));
      grafts = getAugmentList(ns);
      index = 0;
    } else {
      index += 1;
      await ns.sleep(1000);
    }
  }


}

export function getAugmentList(ns: NS): string[] {
  const priorities = ['Graphene Bionic Spine Upgrade','CordiARC Fusion Reactor','SPTN-97 Gene Modification','Graphene Bionic Legs Upgrade', 'Xanipher','Graphene Bone Lacings', 'Graphene Bionic Arms Upgrade','Bionic Legs']
  const grafts = ns.grafting.getGraftableAugmentations();
  const unaquiredPriorities = priorities.filter(p => grafts.includes(p));
  grafts.sort((a, b) => 
    unaquiredPriorities.includes(a) == unaquiredPriorities.includes(b) 
    ? unaquiredPriorities.includes(a) 
      ? ns.grafting.getAugmentationGraftTime(a) - ns.grafting.getAugmentationGraftTime(b)
      : ns.grafting.getAugmentationGraftPrice(b) - ns.grafting.getAugmentationGraftPrice(a) 
    : (unaquiredPriorities.includes(a) ? -1 : 1));
  return grafts;
}