export class ProcessTiming { 
  constructor(
    public filename: string,
    time: number,
    public threads: number,
    public offset = 0,
  ) {
    this._time = time;
  }
  private _time : number;
  public get time(): number {
    return this._time;
  }
  public get adjustedTime() : number {
    return this._time + this.offset;
  }
  public set adjustedTime(v : number) {
    this._time = v;
  }
  public pid = 0;
}