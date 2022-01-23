export class ThreadRatios {
  public hackThreads = 0;
  public growthThreads = 0;
  public weakenHackThreads = 0;
  public weakenGrowthThreads = 0;
  public hackTime = 0;
  public growTime = 0;
  public weakenTime = 0;
  public get totalThreads(): number { return Math.ceil(this.hackThreads) + Math.ceil(this.growthThreads) + Math.ceil(this.weakenHackThreads) + Math.ceil(this.weakenGrowthThreads); }
}
