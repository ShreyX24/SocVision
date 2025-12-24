// Insight calculations and data processing utilities

import { CoreStateData, ProfileInsights, GameProfile } from '../types';

// Generate insights for a game profile
export const generateInsights = (profile: Omit<GameProfile, 'insights'>): ProfileInsights => {
  const pCores = profile.cStateData.filter(c => c.type === 'P-Core');
  const eCores = profile.cStateData.filter(c => c.type === 'E-Core' || c.type === 'LPE-Core');

  const avgPActivity = pCores.length > 0 ? pCores.reduce((sum, c) => sum + c.active, 0) / pCores.length : 0;
  const avgEActivity = eCores.length > 0 ? eCores.reduce((sum, c) => sum + c.active, 0) / eCores.length : 0;
  const avgPFreq = pCores.length > 0 ? pCores.reduce((sum, c) => sum + (c.freq || 0), 0) / pCores.length : 0;
  const avgEFreq = eCores.length > 0 ? eCores.reduce((sum, c) => sum + (c.freq || 0), 0) / eCores.length : 0;

  const pCoreActivity = pCores.length > 0 ? pCores.reduce((s, c) => s + c.active, 0) / pCores.length : 0;
  const eCoreActivity = eCores.length > 0 ? eCores.reduce((s, c) => s + c.active, 0) / eCores.length : 0;

  // C-State averages
  const avgPCC6 = pCores.length > 0 ? pCores.reduce((sum, c) => sum + (c.cc6 || 0), 0) / pCores.length : 0;
  const avgECC6 = eCores.length > 0 ? eCores.reduce((sum, c) => sum + (c.cc6 || 0), 0) / eCores.length : 0;
  const avgPCC7 = pCores.length > 0 ? pCores.reduce((sum, c) => sum + (c.cc7 || 0), 0) / pCores.length : 0;
  const avgECC7 = eCores.length > 0 ? eCores.reduce((sum, c) => sum + (c.cc7 || 0), 0) / eCores.length : 0;
  const avgCC6 = (avgPCC6 + avgECC6) / 2;
  const avgCC7 = (avgPCC7 + avgECC7) / 2;

  // Overall threading ratio
  const threadingRatio = pCoreActivity / (eCoreActivity || 1);

  const insights: ProfileInsights = {
    pCoreActivity: pCoreActivity.toFixed(1),
    eCoreActivity: eCoreActivity.toFixed(1),
    pCoreAvgFreq: avgPFreq.toFixed(0),
    eCoreAvgFreq: avgEFreq.toFixed(0),
    pCoreCC6: avgPCC6.toFixed(1),
    eCoreCC6: avgECC6.toFixed(1),
    pCoreCC7: avgPCC7.toFixed(1),
    eCoreCC7: avgECC7.toFixed(1),
    avgCC6: avgCC6.toFixed(1),
    avgCC7: avgCC7.toFixed(1),
    threadingRatio: threadingRatio.toFixed(2),
    threadingModel: avgPActivity > avgEActivity + 10 ? 'P-Core Dominant' :
                    avgEActivity > avgPActivity + 10 ? 'E-Core Dominant' : 'Balanced',
  };

  // Add extended insights if comprehensive data available
  if (profile.packageCStates) {
    insights.packageC6Residency = profile.packageCStates.pc6.toFixed(1);
    insights.packageC10Residency = profile.packageCStates.pc10.toFixed(1);
  }

  if (profile.s0ixState) {
    insights.s0ixResidency = profile.s0ixState.slpS0Residency.toFixed(1);
  }

  if (profile.powerData) {
    insights.avgPower = profile.powerData.package.toFixed(2);
  }

  if (profile.thermalData) {
    insights.avgTemperature = profile.thermalData.packageTemp.toFixed(1);
  }

  return insights;
};

// Calculate average for array of numbers
export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

// Format duration from seconds to human readable
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
};

// Format frequency value
export const formatFrequency = (mhz: number): string => {
  if (mhz >= 1000) return `${(mhz / 1000).toFixed(2)} GHz`;
  return `${mhz} MHz`;
};

// Format power value
export const formatPower = (watts: number): string => {
  if (watts < 1) return `${(watts * 1000).toFixed(0)} mW`;
  return `${watts.toFixed(2)} W`;
};

// Group cores by type
export const groupCoresByType = (cStateData: CoreStateData[]): Record<string, CoreStateData[]> => {
  return cStateData.reduce((acc, core) => {
    const type = core.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(core);
    return acc;
  }, {} as Record<string, CoreStateData[]>);
};

// Calculate comparison delta
export const calculateDelta = (value1: number, value2: number): { delta: number; percentage: number } => {
  const delta = value1 - value2;
  const percentage = value2 !== 0 ? ((value1 - value2) / value2) * 100 : 0;
  return { delta, percentage };
};

// Get threading model description
export const getThreadingModelDescription = (model: string): string => {
  switch (model) {
    case 'P-Core Dominant':
      return 'Workload primarily utilizes Performance cores. May benefit from E-Core offloading.';
    case 'E-Core Dominant':
      return 'Workload efficiently utilizes Efficiency cores. Good for power efficiency.';
    case 'Balanced':
      return 'Workload is evenly distributed across P and E cores. Optimal thread scheduling.';
    default:
      return 'Unknown threading pattern.';
  }
};
