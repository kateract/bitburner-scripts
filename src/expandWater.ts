import { NS } from "@ns";
import { expandMaterialDivision } from "./manageCorp"
import { exportMaterials } from "./corp";

export async function main (ns: NS) {
  await expandMaterialDivision(ns, "Water Utilities", "Katwater", [])
  await exportMaterials(ns, "Katwater");
}