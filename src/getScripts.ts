import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
  const data = ns.flags([
    ["baseUrl", "http://localhost:5000/"],
    ["continuous", false]
  ])
  const baseUrl = data["baseUrl"] as string;
  const continuous = data["continuous"] as boolean;
  const file = "remote_scripts543543.txt";
  let content = ns.read(file);
  let hash = getHash(content);
  let success = await ns.wget(baseUrl, file, "home");

  while (success) {
    content = ns.read(file);
    const newHash = getHash(content)
    if (hash != newHash) {
      hash = newHash;
      const scripts = JSON.parse(content) as IFileHash[];
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i].name;
        console.log(script);
        await ns.wget(`${baseUrl}${script}`, script, 'home');
      }
    }
    if (!continuous) break;
    await ns.sleep(1000);
    success = await ns.wget(baseUrl, file, "home");
  }
}

const getHash = (input: string): number => {
  let hash = 0, i, chr
  if (input.length === 0) return hash
  for (i = 0; i < input.length; i++) {
    chr = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

interface IFileHash {
  name: string;
  hash: number;
}