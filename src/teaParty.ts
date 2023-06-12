import { NS } from '@ns'
import { teaParty  } from './corp'

export async function main(ns : NS) : Promise<void> {
  let stage = 0
  const states = ['START', 'PURCHASE', 'PRODUCTION', 'EXPORT', 'SALE'];
  const c = ns.corporation;
  while (stage >= 0) {
    while (c.getCorporation().state == states[0]) {
        await ns.sleep(10);
    }

    while (c.getCorporation().state != states[0]) {
        await ns.sleep(10);
    }

    await teaParty(ns);
    stage += 1;
}

}