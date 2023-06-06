import { NS, Server } from '@ns'
import { explore } from '/explore'
import { getRatiosSummary, maximize } from '/ratios';
import { getServerInfo } from '/visualize';
import { batchHWGW, compare } from 'lib/functions';
import { ProcessTiming } from '/ProcessTiming';
import { IAutocompleteData } from './IAutocompleteData';

export async function main(ns: NS): Promise<void> {
  //scan for all available servers
  let buy = false;
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();
  let cycle = 1;
  while (cycle > 0) {
    ns.print("");
    ns.print(`=== Beginning Cycle ${cycle++} ===`);
    ns.print("");
    const servers = await explore(ns, "home");
    
    const scriptHosts = servers.filter(s => s.hasAdminRights && s.maxRam > 0 && s.hostname != "home" && s.hostname != "darkweb").sort((a, b) => compare(a.maxRam, b.maxRam));
    const serverThreads = scriptHosts.map(s => Math.floor(s.maxRam / 1.8));
    const totalThreads = serverThreads.reduce((p, c) => p + c);
    ns.print(`${totalThreads} Threads Total`);

    
    //find best target
    const level = ns.getHackingLevel();
    const hackTargets = servers.filter(s => s.hasAdminRights && s.moneyMax || 0 > 0 && s.requiredHackingSkill && s.requiredHackingSkill <= level)
    //ns.print(hackTargets)
    hackTargets.sort((a, b) => compare(getMoneyPerSecond(ns, a), getMoneyPerSecond(ns, b), true));
    let targetIndex = 0;
    let ratios = await maximize(ns, hackTargets[0], totalThreads)
    while(
      hackTargets[targetIndex].moneyAvailable == hackTargets[targetIndex].moneyMax
      && hackTargets[targetIndex].minDifficulty == hackTargets[targetIndex].hackDifficulty
      && ratios.totalThreads > totalThreads)
    {
      targetIndex++;
      ratios = await maximize(ns, hackTargets[targetIndex], totalThreads);
    }
    let target = hackTargets[targetIndex];
    if (ns.args.length > 0) {
      target = ns.getServer(ns.args[0] as string);
      ns.print(`Targeting ${target.hostname} by argument`)
      ratios = await maximize(ns, target, totalThreads);
    }

    ns.print(getServerInfo(ns, target));
    
    //calculate ratios
    
    
    //distribute threads across servers

    const weakenTiming = [
      new ProcessTiming ("weaken.js", ratios.weakenTime + 1000, totalThreads )
    ];
    const sw = ns.weakenAnalyze(1);
    const sg = ns.growthAnalyzeSecurity(1);
    const wThreads = Math.ceil(((totalThreads - 1)) / ((sw / sg) + 1))
    const growTiming = [
      new ProcessTiming( "grow.js", ratios.growTime + 2000, totalThreads - wThreads),
      new ProcessTiming("weaken.js", ratios.weakenTime + 1000, wThreads)
    ]
    let timing = [];
    if (target && target.hackDifficulty && target.minDifficulty && target.hackDifficulty > target.minDifficulty){
      timing = weakenTiming;
      ns.print(`Weakening ${target.hostname} with ${totalThreads} Threads`)
    }
    else if (target && target.moneyAvailable && target.moneyMax && target.moneyAvailable < target.moneyMax) {
      timing = growTiming;
      ns.print(`Growing ${target.hostname} with ${totalThreads - wThreads} grow threads and ${wThreads} weaken threads`)
    }
    else {
      timing = batchHWGW(ns, ratios, totalThreads, undefined,  2000);
      ns.print(`Executing HWGW on ${target.hostname}`)
      ns.print(getRatiosSummary(ns, ratios));
      ns.print(`${timing.reduce((p, c) => p + c.threads, 0)} threads in ${timing.length} batches.`)
    }


    const order = timing.sort((a, b) => compare(a.time, b.time, true));
    let curServerIndex = 0;
    let threadsRemain = totalThreads;
    let curServerThreadsRemain = serverThreads[curServerIndex];
    let curProcess = 0;
    let curProcessThreadsRemain = order.length > 0 ? order[0].threads : 0;
    while (threadsRemain > 0 && curProcess < order.length) {
      if (curServerThreadsRemain < curProcessThreadsRemain) {
        //ns.print(`P1 Running ${curServerThreadsRemain} instances of ${order[curProcess].process} on ${scriptHosts[curServerIndex].hostname}`);
        ns.exec(order[curProcess].filename, scriptHosts[curServerIndex].hostname, curServerThreadsRemain, target.hostname);
        curProcessThreadsRemain -= curServerThreadsRemain;
        threadsRemain -= curServerThreadsRemain;
        curServerIndex += 1;
        curServerThreadsRemain = serverThreads[curServerIndex];
      }
      else if (curServerThreadsRemain > curProcessThreadsRemain) {
        //ns.print(`P2 Running ${curProcessThreadsRemain} instances of ${order[curProcess].process} on ${scriptHosts[curServerIndex].hostname}`);
        ns.exec(order[curProcess].filename, scriptHosts[curServerIndex].hostname, curProcessThreadsRemain, target.hostname);
        curServerThreadsRemain -= curProcessThreadsRemain;
        threadsRemain -= curProcessThreadsRemain;
        curProcess += 1;
        if (curProcess == order.length) {
          continue;
        }
        curProcessThreadsRemain = order[curProcess].threads;
        await ns.sleep(order[curProcess - 1].time - order[curProcess].time)
      } else if (curServerThreadsRemain == curProcessThreadsRemain) {
        //ns.print(`P3 Running ${curProcessThreadsRemain} instances of ${order[curProcess].filename} on ${scriptHosts[curServerIndex].hostname}`);
        ns.exec(order[curProcess].filename, scriptHosts[curServerIndex].hostname, curProcessThreadsRemain, target.hostname);
        threadsRemain -= curProcessThreadsRemain
        curProcess += 1;
        if (curProcess == order.length) {
          continue;
        }
        curProcessThreadsRemain = order[curProcess].threads;
        curServerIndex += 1;
        curServerThreadsRemain = serverThreads[curServerIndex];
        await ns.sleep(order[curProcess - 1].time - order[curProcess].time)
      }
      else {
        ns.print("Something Went Wrong");
        ns.exit();
      }
    }
    await ns.sleep(order[order.length - 1].time);
    if(buy) {
      const buypid = ns.exec("buySevers2.js", "home", 1);
      await ns.sleep(30 * 1000)
      if (ns.ps("home").find(p => p.pid == buypid) == undefined) buy = false;
      ns.kill(buypid);
    }
  }
}
function getMoneyPerSecond(ns: NS, server: Server) {
  if (server.moneyMax)
    return server.moneyMax / ns.getWeakenTime(server.hostname) * 1000;
  return 0;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: IAutocompleteData, args : string[]) : string[] {
  return [...data.servers]
}