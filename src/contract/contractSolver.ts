import { CodingContract, NS } from "@ns";
import { largestPrimeFactor } from "/contract/largestPrimeFactor";
import { subarrayMaxSum } from "/contract/subarrayMaxSum";
import { totalWaysToSum, totalWaysToSum2 } from "/contract/totalWaysToSum";
import { spiralizeMatrix } from "/contract/spiralizeMatrix";
import { arrayJumpingGame, arrayJumpingGame2 } from "/contract/arrayJumpingGame";
import { mergeOverlappingIntervals } from "/contract/mergeOverlappingIntervals";
import { generateIpAddresses } from "/contract/generateIpAddresses";
import { algorithmicStockTrader, algorithmicStockTrader2, algorithmicStockTrader3, algorithmicStockTrader4 } from "/contract/algorithmicStockTrader";
import { minimumPathSumTriangle } from "/contract/miniumumPathSumTriangle";
import { uniquePathsInAGrid, uniquePathsInAGrid2 } from "/contract/uniquePathsInAGrid";
import { sanitizeParenthesis as sanitizeParentheses } from "/contract/sanitizeParentheses";
import { findAllValidExpressions } from "/contract/findAllValidExpressions";
import { hammingCodesBinaryToInteger, hammingCodesIntegerToBinary } from "/contract/hammingCode";
import { proper2ColoringGraph } from "/contract/graph";
import { lzDecompression, rleCompression } from "/contract/compression";

export async function contractSolver(ns: NS, host: string, contract: string) {
  const c = ns.codingcontract
  const rawData = c.getData(contract, host);
  const type = c.getContractType(contract, host);


  if (type == 'Find Largest Prime Factor') {
    const data = rawData as number
    const answer = largestPrimeFactor(data)
    return answerQuestion(ns, answer, c, contract, host);

  }

  if (type == 'Subarray with Maximum Sum') {
    const data = rawData as number[]
    const answer = subarrayMaxSum(data).reduce((pre, cur) => pre + cur, 0)
    return answerQuestion(ns, answer, c, contract, host);

  }

  if (type == 'Total Ways to Sum') {
    const data = rawData as number
    const answer = totalWaysToSum(data);
    return answerQuestion(ns, answer, c, contract, host);

  }

  if (type == 'Total Ways to Sum II') {
    const data1 = rawData[0] as number;
    const data2 = rawData[1] as number[];
    const answer = totalWaysToSum2(data1, data2);
    return answerQuestion(ns, answer, c, contract, host);

  }

  if (type == 'Spiralize Matrix') {
    const data = rawData as number[][];
    const answer = spiralizeMatrix(data);
    return answerQuestion(ns, answer, c, contract, host);

  }

  if (type == 'Array Jumping Game') {
    const data = rawData as number[];
    const answer = arrayJumpingGame(data);
    return answerQuestion(ns, answer, c, contract, host);

  }

  if (type == 'Array Jumping Game II') {
    const data = rawData as number[];
    const answer = arrayJumpingGame2(data);
    return answerQuestion(ns, answer, c, contract, host);

  }

  if (type == 'Merge Overlapping Intervals') {
    const data = rawData as number[][];
    const answer = mergeOverlappingIntervals(data)
    return answerQuestion(ns, answer, c, contract, host);

  }

  if (type == 'Generate IP Addresses') {
    const data = rawData as string;
    const answer = generateIpAddresses(data);
    return answerQuestion(ns, answer, c, contract, host);

  }

  if (type == 'Algorithmic Stock Trader I') {
    const data = rawData as number[];
    const answer = algorithmicStockTrader(data);
    return answerQuestion(ns, answer, c, contract, host);
  }

  if (type == 'Algorithmic Stock Trader II') {
    const data = rawData as number[];
    const answer = algorithmicStockTrader2(data);
    return answerQuestion(ns, answer, c, contract, host);
  }

  if (type == 'Algorithmic Stock Trader III') {
    const data = rawData as number[];
    const answer = algorithmicStockTrader3(data);
    return answerQuestion(ns, answer, c, contract, host);
  }

  if (type == 'Algorithmic Stock Trader IV') {
    const k = rawData[0] as number;
    const data = rawData[1] as number[];
    const answer = algorithmicStockTrader4(k, data);
    return answerQuestion(ns, answer, c, contract, host);
  }

  if (type == 'Minimum Path Sum in a Triangle') {
    const data = rawData as number[][];
    const answer = minimumPathSumTriangle(data);
    return answerQuestion(ns, answer, c, contract, host);
  }

  if (type == 'Unique Paths in a Grid I')  {
    const data = rawData as number[];
    const answer = uniquePathsInAGrid(data);
    return answerQuestion(ns, answer, c, contract, host);
  }
  if (type == 'Unique Paths in a Grid II')  {
    const data = rawData as number[][];
    const answer = uniquePathsInAGrid2(data);
    return answerQuestion(ns, answer, c, contract, host);
  }
  
  // if (type == 'Shortest Path in a Grid') {
  //   const data = rawData as number[][];
  //   const answer = shortestPathInAGrid(data);
  //   return answerQuestion(ns, answer, c, contract, host);
  // }

  if (type == 'Sanitize Parentheses in Expression') {
    const data = rawData as string;
    const answer = sanitizeParentheses(data);
    return answerQuestion(ns, answer, c, contract, host);
  }

  if (type == 'Find All Valid Math Expressions') {
    const data = rawData[0] as string;
    const target = rawData[1] as number;
    const answer = findAllValidExpressions(data, target);
    return answerQuestion(ns, answer, c, contract, host);
  }

  if (type == 'HammingCodes: Integer to Encoded Binary') {
    const data = rawData as string;
    const answer = hammingCodesIntegerToBinary(data);
    return answerQuestion(ns, answer, c, contract, host);
  }

  if (type == 'HammingCodes: Encoded Binary to Integer') {
    const data = rawData as string;
    const answer = hammingCodesBinaryToInteger(data);
    return answerQuestion(ns, answer, c, contract, host);
  }

  
  if (type == 'Proper 2-Coloring of a Graph') {
    const k = rawData[0] as number;
    const data = rawData[1] as number[][];
    const answer = proper2ColoringGraph(k, data);
    return answerQuestion(ns, answer, c, contract, host);
  }

  if (type == 'Compression I: RLE Compression') {
    const data = rawData as string;
    const answer = rleCompression(data);
    return answerQuestion(ns, answer, c, contract, host);
  }

  if (type == 'Compression II: LZ Decompression') {
    const data = rawData as string;
    const answer = lzDecompression(data);
    return answerQuestion(ns, answer, c, contract, host);
  }

  ns.print(`No Solver for type ${type}`)
  if (ns.fileExists(contract, host) && host != "home") {
    ns.rm(contract, host);
  }
}

function answerQuestion(ns: NS, answer: string | number | string[] | number[] | number[][], c: CodingContract, contract: string, host: string) {
  ns.print(answer);
  const res = c.attempt(answer, contract, host);
  ns.print(res);
  return;
}

