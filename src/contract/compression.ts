export function rleCompression(data: string) {
  let i = 0;
  let res = "";
  let c = 0;
  let char = data[0];
  while (i < data.length) {
    if (data[i] == char) {
      c++;
      if (c == 10) {
        res = res.concat("9", char)
        c = 1;
      }
    }
    else {
      res = res.concat(c.toString(), char);
      char = data[i];
      c = 1
    }
    i++;
  }
  return res.concat(c.toString(), char);
}

export function lzDecompression(data: string) {
  let index = 0;
  let res = "";
  while (index < data.length) {
    let length = +data[index++];
    if (length != 0) {
      res += data.substring(index, index + length)
      index += length;
    }
    console.log(index)
    if (index >= data.length) { break; }
    length = +data[index++]
    if (length == 0) { continue; }
    const shift = +data[index++]
    for (let i = 0; i < length; i++) {
      res = res.concat(res[res.length - shift]);
    }
  }
  return res;
}

export function lzCompression(uncompressed: string) {
  let i: number;
  const dictionary = new Map<string, number>();
  let c: string;
  let wc: string;
  let w = "";
  const result: string[] = [];
  let dictSize = 256;
  for (i = 0; i < 256; i += 1) {
    dictionary.set(String.fromCharCode(i), i)
  }

  for (i = 0; i < uncompressed.length; i += 1) {
    c = uncompressed.charAt(i);
    wc = w + c;
    //Do not use dictionary[wc] because javascript arrays 
    //will return values for array['pop'], array['push'] etc
    // if (dictionary[wc]) {
    if (dictionary.get(wc)) {
      w = wc;
    } else {
      result.push(dictionary.get(w)!.toString());
      // Add wc to the dictionary.
      dictionary.set(wc, dictSize++);
      w = String(c);
    }
  }

  // Output the code for w.
  if (w !== "") {
    result.push(dictionary[w]);
  }
  return result;
}