import { NS } from '@ns'
import { newMaximize } from '/ratios'

export async function main(ns : NS) : Promise<void> {
  newMaximize(ns, "foodnstuff", 40)
}