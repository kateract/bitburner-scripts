export function generateIpAddresses(data: string) {
  const strings: string[][] = []
  for(let i = 0; i < data.length; i++) {
    const b:string[] = [];
    b.push(data.substring(i, i+1))
    if(data[i] != '0' && i+1 < data.length) b.push(data.substring(i, i+2));
    if (data[i] != '0' && (data.substring(i, i+3) < '256') && (i + 2 < data.length)) b.push(data.substring(i, i+3))
    strings.push(b);
  }
  const ips: string[] = [];
  for(let o1 = 0; o1 < strings[0].length; o1++) {
    const s1 = strings[0][o1];
    const l1 = s1.length;
    if(data.length - l1 > 9) continue;
    for(let o2 = 0; o2 < strings[s1.length].length; o2++){
      const s2 = strings[l1][o2];
      const l2 = l1 + s2.length;
      if(data.length - l2 > 6 || data.length - l2 <= 1) continue;
      for(let o3 = 0; o3 < strings[l2].length; o3++){
        const s3 = strings[l2][o3];
        const l3 = l2 + s3.length;
        if (data.length - l3 > 3 || data.length - l3 <= 0) continue;
        for(let o4 = 0; o4 < strings[l3].length; o4++) {
          const s4 = strings[l3][o4];
          const l4 = l3 + s4.length;
          if (data.length != l4) continue;
          ips.push(`${s1}.${s2}.${s3}.${s4}`);
        }
      }
    }
  }
  return ips;

}