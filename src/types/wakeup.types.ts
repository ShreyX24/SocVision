// Wakeup and interrupt types

export interface WakeupData {
  packageWakeups: WakeupEntry[];
  coreWakeups: WakeupEntry[];
  threadWakeups: WakeupEntry[];
}

export interface WakeupEntry {
  source: string;
  count: number;
  percentage?: number;
}

export interface InterruptData {
  irqNumber: number;
  deviceName: string;
  count: number;
}
