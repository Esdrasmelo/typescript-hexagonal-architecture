import { IClockPort } from "../../../core/ports";

export class SystemClock implements IClockPort {
  public now(): Date {
    return new Date();
  }
}
