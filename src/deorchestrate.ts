import { NS } from '@ns'
import { explore } from './explore';

export async function main(ns: NS) {
  ns.scriptKill('prepareServer.js', 'home');
  ns.scriptKill('homeDispatch.js', 'home');
  ns.scriptKill('dispatcher.js','home');
  ns.scriptKill('dispatcher2.js', 'home');
  ns.scriptKill('orchestrator.js', 'home');
  const servers = await explore(ns, 'home');
  servers.push(ns.getServer('home'));
  servers.forEach(s => {
    ns.scriptKill('weaken.js', s.hostname);
    ns.scriptKill('hack.js', s.hostname);
    ns.scriptKill('grow.js', s.hostname);
    ns.scriptKill('weakenTwice.js', s.hostname)
  })
}