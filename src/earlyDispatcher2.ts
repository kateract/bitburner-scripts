import { NS, Player, Server } from '@ns'
import { explore } from '/explore'
import { getRatiosSummary, maximize } from '/ratios';
import { getServerInfo } from '/visualize';
import { batchHWGW, compare } from 'lib/functions';
import { ProcessTiming } from '/ProcessTiming';

export async function main(ns: NS): Promise<void> {
    //scan for all available servers
    let gap = 200; //process gap in ms
    ns.disableLog("ALL");
    ns.clearLog();
    ns.tail();
    let cycle = 1;
    const actions: Action[] = [];
    const start = new Date();
    while (true) {
        ns.print("");
        ns.print(`=== Beginning Cycle ${cycle++} ===`);
        ns.print("");
        const servers = await explore(ns, "home");

        const scriptHosts = servers.filter(s => s.hasAdminRights && s.maxRam > 0 && s.hostname != "home" && s.hostname != "darkweb").sort((a, b) => compare(a.maxRam, b.maxRam));
        const serverThreads = scriptHosts.map(s => Math.floor(s.maxRam / 1.8));
        const totalThreads = serverThreads.reduce((p, c) => p + c);
        ns.print(`${totalThreads} Threads Total`);
        const player = ns.getPlayer();

        //find best target
        const level = player.skills.hacking;
        const hackTargets = servers.filter(s => s.hasAdminRights && s.moneyMax > 0 && s.requiredHackingSkill <= level)
        var mpsList = hackTargets.map(s => getMoneyPerSecond2(ns, player, s));
        var target = hackTargets[mpsList.indexOf(Math.max(...mpsList))];

        const endPlayer = ns.getPlayer();
        const endServers = await explore(ns, "home");
        simActions(ns, endPlayer, endServers, actions);


    }
}

function getMoneyPerSecond2(ns: NS, player: Player, server: Server) {
    var theoryServer = ns.getServer(server.hostname)
    theoryServer.moneyAvailable = server.moneyMax
    return theoryServer.moneyMax / ns.formulas.hacking.weakenTime(theoryServer, player) * 1000;
}

function simActions(ns: NS, player: Player, servers: Server[], actions: Action[], targetDate: Date|null = null) {
    actions.sort((a, b) => a.Finishes == b.Finishes ? 0 : a.Finishes < b.Finishes ? -1 : 1)
    actions.forEach(action => {
        if(targetDate != null && (action.Finishes > targetDate)) return;
        let host = servers.find(s => s.hostname = action.Host) ?? ns.getServer(action.Host);
        let target = servers.find(s => s.hostname = action.Target) ?? ns.getServer(action.Target);
        switch (action.ActionType) {
            case ActionType.HACK:
                host.ramUsed -= ns.getScriptRam("hack.js", host?.hostname) * action.Threads;
                target.moneyAvailable -= ns.formulas.hacking.hackPercent(target, player) * action.Threads * target.moneyAvailable;
                target.hackDifficulty += action.Threads * 0.002;
                player.exp.hacking += ns.formulas.hacking.hackExp(target, player) * action.Threads;
                break;
            case ActionType.GROW:
                host.ramUsed -= ns.getScriptRam("grow.js", host?.hostname) * action.Threads;
                target.hackDifficulty += action.Threads * 0.004
                target.moneyAvailable += ns.formulas.hacking.growPercent(target, action.Threads, player) * target.moneyAvailable;
                
                break;
            case ActionType.WEAKEN:
                host.ramUsed -= ns.getScriptRam("weaken.js", host?.hostname) * action.Threads;
                target.hackDifficulty -= action.Threads * 0.05
                break;
            default:
                break;
        }
    });
}

class Action {
    constructor(actionType: ActionType, threads: number, finishes: Date, processId: number, host: string, target: string) {
        this.ActionType = actionType;
        this.Threads = threads;
        this.Finishes = finishes;
        this.ProcessId = processId;
        this.Host = host;
        this.Target = target;
    }
    public ActionType: ActionType;
    public Threads: number;
    public Finishes: Date;
    public ProcessId: number;
    public Host: string;
    public Target: string;
}

enum ActionType {
    HACK,
    GROW,
    WEAKEN
}