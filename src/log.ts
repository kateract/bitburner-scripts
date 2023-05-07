import { NS } from '@ns'
import { Port } from '/ports'
export async function main(ns : NS) : Promise<void> {
  ns.disableLog("ALL");
  ns.tail();
  ns.clearLog();
  const port = ns.getPortHandle(Port.DISPATCH_LOG)
  while (true) {
    if (port.empty()) {
      await ns.sleep(200);
      continue;
    }
    ns.print(port.read() as string);
    //await ns.sleep(200);
  }
}