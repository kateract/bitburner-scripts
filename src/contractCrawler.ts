import { NS } from '@ns'
import { searchContracts } from '/functions'

export async function main(ns : NS) : Promise<void> {
  await searchContracts(ns);
}