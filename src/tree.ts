import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
  const target = ns.args[0] as string;
  const path = find(ns, ns.getHostname(), "", target )
  ns.tprintf(path.join(", "));
}

export function find(ns: NS, server: string, oldServer: string, target: string): string[] {
  const servers = ns.scan(server);
  if (servers.length == 0) {
    return [];
  }
  for (const item of servers) {
    if (item == oldServer) continue;
    if (item == target) {
      return [server, target];
    }
    const res = find(ns, item, server, target);
    if (res.length > 0){
      res.unshift(server);
      return res;
    }
  }
  return [];
}