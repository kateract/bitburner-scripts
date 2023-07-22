import { NS } from '@ns'

export async function main (ns: NS) {
  while(ns.bladeburner.inBladeburner()) {
    const player = ns.getPlayer()
    const work = ns.singularity.getCurrentWork()
    if(player.hp.current < player.hp.max / 2 && ns.bladeburner.getCurrentAction().name != "Hyperbolic Regeneration Chamber" ) {
      ns.bladeburner.startAction("General", "Hyperbolic Regeneration Chamber");
    } else if (player.hp.current == player.hp.max && ns.bladeburner.getCurrentAction().name != "Retirement") {
      ns.bladeburner.startAction("Contracts", "Retirement");
    }

    await ns.sleep(1000);
  }
}