import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
  const file = "remote_scripts543543.txt";
  let content = ns.read(file);
  let hash = getHash(content);

  while (true) {
    await ns.wget("http://localhost:5000/", file, "home");
    content = ns.read(file);
    const newHash = getHash(content)
    if (hash != newHash) {
      hash = newHash;
      const scripts = JSON.parse(content) as string[];
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        console.log(script);
        await ns.wget(`http://localhost:5000/${script}`, script, 'home');
      }
    }
    await ns.sleep(1000);
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