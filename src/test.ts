import { NS, SleeveFactionTask } from '@ns'
import { batchHWGW } from 'lib/functions';
import { getRatiosSummary, maximize } from '/ratios';
//import { getAugmentList } from './grafting';
import { getFactionRepNeeded } from './lib/augments';
import { contractSolver } from './contract/contractSolver';
import { largestPrimeFactor } from './contract/largestPrimeFactor';
// import { Port } from '/ports';
// import { getRatiosSummary, maximize } from '/ratios'

export async function main(ns: NS): Promise<void> {
  ns.clearLog();
  ns.tail();

  const c = ns.codingcontract;
  const index = 24
  const types = c.getContractTypes();
  //console.log(types[index])
  ns.print(`contract type ${index + 1} of ${types.length}`);
  //types.forEach(t => ns.print(t))
  let contracts = ns.ls('home', '.cct');
  if (contracts.length == 0) {
    c.createDummyContract(types[index]);
    contracts = ns.ls('home', '.cct');
  }
  ns.print(contracts);
  const desc = c.getDescription(contracts[0]);
  const data = c.getData(contracts[0]);
  ns.print(desc);
  ns.print(data);
  const type = c.getContractType(contracts[0]);
  if (type == types[index]) {
    ns.print(type);
  }
  ns.print("Solving...")
  contractSolver(ns, 'home', contracts[0])
}
