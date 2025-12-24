// Profile and SKU types

import { CoreStateData, OsCStateData } from './core-state.types';
import { PackageCStateData, S0ixState, CStateBlocker, WakeCause } from './package-state.types';
import { PowerData, ThermalData, ConcurrencyData, FrequencyDistribution } from './power-thermal.types';
import { WakeupData } from './wakeup.types';

export interface ProfileMetadata {
  duration?: number;
  baseFreq?: number;
  totalCores?: number;
  pCoreCount?: number;
  eCoreCount?: number;
  lpeCoreCount?: number;
  collectionDate?: string;
  cpuModel?: string;
}

export interface ProfileInsights {
  pCoreActivity: string;
  eCoreActivity: string;
  pCoreAvgFreq: string;
  eCoreAvgFreq: string;
  pCoreCC6: string;
  eCoreCC6: string;
  pCoreCC7: string;
  eCoreCC7: string;
  avgCC6: string;
  avgCC7: string;
  threadingRatio: string;
  threadingModel: string;
  // Extended insights for comprehensive format
  packageC6Residency?: string;
  packageC10Residency?: string;
  s0ixResidency?: string;
  avgPower?: string;
  avgTemperature?: string;
}

export type CSVFormatVersion = 'legacy' | 'comprehensive';

export interface GameProfile {
  name: string;
  metadata: ProfileMetadata;
  coreTypes: Record<number, 'P-Core' | 'E-Core' | 'LPE-Core'>;
  cStateData: CoreStateData[];
  avgFrequencies: Array<{ core: number; freq: number; type: string }>;
  insights: ProfileInsights;
  formatVersion?: CSVFormatVersion;
  // Extended data for comprehensive format
  osCStateData?: OsCStateData[];
  packageCStates?: PackageCStateData;
  s0ixState?: S0ixState;
  wakeCauses?: WakeCause[];
  cStateBlockers?: CStateBlocker[];
  wakeupData?: WakeupData;
  powerData?: PowerData;
  thermalData?: ThermalData;
  concurrency?: ConcurrencyData;
  frequencyDistribution?: FrequencyDistribution[];
}

export interface SelectedGame extends GameProfile {
  skuName: string;
}

export interface SKU {
  name: string;
  games: GameProfile[];
  isArchived?: boolean;
}

export interface ComparisonItem {
  game: GameProfile;
  skuName: string;
}
