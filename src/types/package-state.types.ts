// Package C-State and S0ix types

export interface PackageCStateData {
  pc0: number;
  pc2: number;
  pc6: number;
  pc10: number;
}

export interface S0ixSubstate {
  s0i2_0: number;
  s0i2_1: number;
  s0i2_2: number;
}

export interface S0ixState {
  slpS0Residency: number;
  s0i2: S0ixSubstate;
}

export interface CStateDebugInfo {
  blockers: CStateBlocker[];
  wakeCauses: WakeCause[];
}

export interface CStateBlocker {
  blocker: string;
  state: string;
  count: number;
}

export interface WakeCause {
  cause: string;
  count: number;
}
