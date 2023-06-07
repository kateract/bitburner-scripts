import { NS } from '@ns'

class ProgramStatus  {
    constructor(
    public name: string,
    public cost: number,
    public owned: boolean) {}
}

export async function main(ns : NS) : Promise<void> {
    ns.disableLog("ALL");
    ns.clearLog();
    ns.tail();
    if(!ns.hasTorRouter()){
        while(ns.getServerMoneyAvailable("home") < 200000) {
            await ns.sleep(1000);
        }
        ns.singularity.purchaseTor();
    }
    const priority = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe", "ServerProfiler.exe", "DeepscanV1.exe", "DeepscanV2.exe", "AutoLink.exe", "Formulas.exe"]
    let programs = ns.singularity.getDarkwebPrograms().map(p => new ProgramStatus (p, ns.singularity.getDarkwebProgramCost(p), ns.fileExists(p) ))
    let p = 0
    for (let index = 0; index < priority.length; index++) {
        const program = programs.find(p => p.name == priority[index]);
        if(!program) continue;
        if(!program.owned) {
            ns.print(`Buying ${program.name} ($${ns.formatNumber(program.cost)})`);
            while(ns.getServerMoneyAvailable("home") < program.cost){
                await ns.sleep(1000);
            }
            
            ns.singularity.purchaseProgram(program.name);
            if ((index < 4 && ns.getServerMoneyAvailable("home") < (programs.find(prog => prog.name == priority[index + 1])?.cost ?? 0)) || index == 4) ns.exec("explore.js", "home");
            ns.print(`Bought ${program.name}.`);
            
            program.owned = true;
        } else {
            ns.print(`Alraedy own ${program.name}.`)
        }
    }
    ns.print("All done, buying servers now!");
    ns.spawn("buyServers3.js");
}

















