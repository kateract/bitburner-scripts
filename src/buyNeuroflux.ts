import { NS } from '@ns'

const nfg = 'NeuroFlux Governor';
export async function main(ns : NS) : Promise<void> {
  const player = ns.getPlayer();
  const rep = player.factions.filter(f => ns.singularity.getAugmentationsFromFaction(f).includes(nfg)).map(faction =>  ({faction,  rep: ns.singularity.getFactionRep(faction)}));
  rep.sort((a, b) => b.rep - a.rep);
  let repReq = ns.singularity.getAugmentationRepReq(nfg)

  let price = ns.singularity.getAugmentationPrice(nfg)
  let money = ns.getServerMoneyAvailable('home')
  while (price < money && repReq < rep[0].rep) {
    ns.singularity.purchaseAugmentation(rep[0].faction, nfg)
    price = ns.singularity.getAugmentationPrice(nfg)
    money = ns.getServerMoneyAvailable('home')
    repReq = ns.singularity.getAugmentationRepReq(nfg)
  }
}