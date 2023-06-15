import { NS } from '@ns'

export function getFactionRepNeeded(ns: NS): Map<string, number> {
  const player = ns.getPlayer()
  const ownedAugs = ns.singularity.getOwnedAugmentations(true)
  const items = new Map<string, number>( player.factions.map(faction => [faction, Math.max(...ns.singularity.getAugmentationsFromFaction(faction).filter(a => a != "Neuroflux Governor"  && !ownedAugs.includes(a) ).map(aug => ns.singularity.getAugmentationRepReq(aug))) - ns.singularity.getFactionRep(faction)]))
  items.forEach((v, k, m) => {if(v < 0) m.delete(k);})
  return items;  
}