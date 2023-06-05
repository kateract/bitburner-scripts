import { NS } from '@ns'

const nfg = 'NeuroFlux Governor';
export async function main(ns : NS) : Promise<void> {
  var player = ns.getPlayer();
  var rep = player.factions.map(faction =>  ({faction,  rep: ns.singularity.getFactionRep(faction)}));
  rep.sort((a, b) => b.rep - a.rep);
  var repReq = ns.singularity.getAugmentationRepReq(nfg)

  var price = ns.singularity.getAugmentationPrice(nfg)
  var money = ns.getServerMoneyAvailable('home')
  while (price < money && repReq < rep[0].rep) {
    ns.singularity.purchaseAugmentation(rep[0].faction, nfg)
    price = ns.singularity.getAugmentationPrice(nfg)
    money = ns.getServerMoneyAvailable('home')
    repReq = ns.singularity.getAugmentationRepReq(nfg)
  }
}