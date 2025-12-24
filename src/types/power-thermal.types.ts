// Power and thermal data types

export interface PowerData {
  package: number;
  core: number;
  gt: number;
  uncore?: number;
  dram?: number;
}

export interface ThermalData {
  packageTemp: number;
  coreTemps: CoreTemperature[];
  tjMax?: number;
}

export interface CoreTemperature {
  core: number;
  temperature: number;
  throttled?: boolean;
}

export interface ConcurrencyData {
  cpuOnly: number;
  gpuOnly: number;
  concurrent: number;
  bothIdle: number;
}

export interface FrequencyDistribution {
  bucket: string;
  percentage: number;
  minFreq: number;
  maxFreq: number;
}
