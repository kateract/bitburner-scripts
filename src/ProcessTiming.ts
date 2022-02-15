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
  public get time() : number {
    return this._time + this.offset;
  }
  public set time(v : number) {
    this._time = v;
  }
}