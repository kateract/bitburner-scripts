import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  const player = ns.getPlayer();
  const favor = player.factions.map(f => ns.getFactionFavor(f));
  const favorGain = player.factions.map(f => ns.getFactionFavorGain(f));
  ns.tprintf("Faction: Favor(Gain)");
  player.factions.forEach((f, i) => ns.tprintf("%s: %d(%d)", f, favor[i], favorGain[i]));
}