import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  ns.disableLog("sleep");
  ns.clearLog();
  ns.tail();
  const nci = "nickofolas Congruity Implant";
  let grafts = ns.grafting.getGraftableAugmentations();
  while(ns.singularity.isBusy()) {
    await ns.sleep(1000);
  }
  if (grafts.includes(nci)){
    while(ns.getServerMoneyAvailable('home') < ns.grafting.getAugmentationGraftPrice(nci)){
      await ns.sleep(1000);
    }
    ns.grafting.graftAugmentation(nci);
    await ns.sleep(ns.grafting.getAugmentationGraftTime(nci));
    grafts = ns.grafting.getGraftableAugmentations();
  }
  while(grafts.length > 0)
  {
    const aug = grafts.reduce((p, c) => ns.grafting.getAugmentationGraftPrice(p) > ns.grafting.getAugmentationGraftPrice(c) ? p : c )
    const started = ns.grafting.graftAugmentation(aug, ns.singularity.isFocused())
    if (started) {
      await ns.sleep(ns.grafting.getAugmentationGraftTime(aug));
      grafts = ns.grafting.getGraftableAugmentations();
    } else {
      grafts = grafts.filter(g => g != aug)
      await ns.sleep(1000);
    }
  }
}