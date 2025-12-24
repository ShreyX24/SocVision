// Comprehensive parser for socwatch-all-trace.csv format

import {
  GameProfile,
  CoreStateData,
  PackageCStateData,
  S0ixState,
  WakeCause,
  CStateBlocker,
  PowerData,
  ThermalData,
  ConcurrencyData,
  WakeupData,
  WakeupEntry
} from '../types';
import { generateInsights } from '../utils/calculations';

type CoreType = 'P-Core' | 'E-Core' | 'LPE-Core';

export const parseComprehensiveFormat = (fileContent: string, filename: string): GameProfile => {
  const lines = fileContent.split('\n');

  const profile: Omit<GameProfile, 'insights'> = {
    name: filename.replace('.csv', '').replace(/PTATMonitor.*/, '').trim(),
    metadata: {},
    coreTypes: {},
    cStateData: [],
    avgFrequencies: [],
    formatVersion: 'comprehensive'
  };

  // Extract metadata
  extractMetadata(lines, profile);

  // Extract core types
  extractCoreTypes(lines, profile);

  // Parse C-State data (hardware)
  parseCoreState(lines, profile);

  // Parse frequency data
  parseFrequencyData(lines, profile);

  // Merge frequency into cState
  profile.cStateData.forEach(cData => {
    const freqData = profile.avgFrequencies.find(f => f.core === cData.core);
    if (freqData) cData.freq = freqData.freq;
  });

  // Parse Package C-States
  profile.packageCStates = parsePackageCStates(lines);

  // Parse S0ix States
  profile.s0ixState = parseS0ixState(lines);

  // Parse Wakeup Data
  profile.wakeupData = parseWakeupData(lines);

  // Parse Power Data
  profile.powerData = parsePowerData(lines);

  // Parse Thermal Data
  profile.thermalData = parseThermalData(lines);

  // Parse Concurrency Data
  profile.concurrency = parseConcurrencyData(lines);

  const insights = generateInsights(profile);
  return { ...profile, insights };
};

function extractMetadata(lines: string[], profile: Omit<GameProfile, 'insights'>): void {
  let pCoreCount = 0;
  let eCoreCount = 0;
  let lpeCoreCount = 0;

  for (let i = 0; i < Math.min(100, lines.length); i++) {
    if (lines[i].includes('Collection duration')) {
      const match = lines[i].match(/(\d+\.?\d*)/);
      if (match) profile.metadata.duration = parseFloat(match[1]);
    }
    if (lines[i].includes('CPU Base Operating Frequency')) {
      const match = lines[i].match(/(\d+)/);
      if (match) profile.metadata.baseFreq = parseInt(match[1]);
    }
    if (lines[i].includes('Total # of cores:')) {
      const match = lines[i].match(/(\d+)/);
      if (match) profile.metadata.totalCores = parseInt(match[1]);
    }
    if (lines[i].includes('Data Collection Started:')) {
      const match = lines[i].match(/Data Collection Started: (.+)/);
      if (match) profile.metadata.collectionDate = match[1].trim();
    }
    if (lines[i].includes('CPU:')) {
      const match = lines[i].match(/CPU: (.+)/);
      if (match) profile.metadata.cpuModel = match[1].trim();
    }
    // Count core types
    if (lines[i].includes('(P Core)')) pCoreCount++;
    if (lines[i].includes('(E Core)')) eCoreCount++;
    if (lines[i].includes('(LPE Core)')) lpeCoreCount++;
  }

  profile.metadata.pCoreCount = pCoreCount;
  profile.metadata.eCoreCount = eCoreCount;
  profile.metadata.lpeCoreCount = lpeCoreCount;
}

function extractCoreTypes(lines: string[], profile: Omit<GameProfile, 'insights'>): void {
  for (let i = 0; i < lines.length; i++) {
    // New format: Package_0/Core_0 = CGC (P Core), DKT (E Core), DKT (LPE Core)
    const match = lines[i].match(/Package_0\/Core_(\d+) = \w+ \((P Core|E Core|LPE Core)\)/);
    if (match) {
      const coreNum = parseInt(match[1]);
      const coreTypeMap: Record<string, CoreType> = {
        'P Core': 'P-Core',
        'E Core': 'E-Core',
        'LPE Core': 'LPE-Core'
      };
      profile.coreTypes[coreNum] = coreTypeMap[match[2]] || 'E-Core';
    }

    // Old format fallback
    const oldMatch = lines[i].match(/Package_0\/Core_(\d+) = (LNC|SKT)/);
    if (oldMatch) {
      const coreNum = parseInt(oldMatch[1]);
      profile.coreTypes[coreNum] = oldMatch[2] === 'LNC' ? 'P-Core' : 'E-Core';
    }
  }
}

function parseCoreState(lines: string[], profile: Omit<GameProfile, 'insights'>): void {
  let cStateStartIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Core C-State Summary: Residency (Percentage and Time)')) {
      cStateStartIdx = i + 1;
      break;
    }
  }

  if (cStateStartIdx > 0) {
    const cStateLines: string[] = [];
    for (let i = cStateStartIdx; i < lines.length; i++) {
      if (lines[i].trim() === '' || lines[i].includes('Core C-State Summary: Total Samples')) break;
      cStateLines.push(lines[i]);
    }

    if (cStateLines.length > 2) {
      const dataRows = cStateLines.slice(2);
      dataRows.forEach(row => {
        const values = row.split(',');
        const state = values[0]?.trim();
        if (state && !state.includes('---')) {
          for (let coreId = 0; coreId < (profile.metadata.totalCores || 0); coreId++) {
            const residency = parseFloat(values[coreId + 1]) || 0;
            let coreData = profile.cStateData.find(c => c.core === coreId);
            if (!coreData) {
              coreData = {
                core: coreId,
                type: profile.coreTypes[coreId] || 'Unknown',
                active: 0,
                cc6: 0,
                cc7: 0
              };
              profile.cStateData.push(coreData);
            }
            if (state === 'CC0') coreData.cc0 = residency;
            else if (state === 'CC1') coreData.cc1 = residency;
            else if (state === 'CC6') coreData.cc6 = residency;
            else if (state === 'CC7') coreData.cc7 = residency;

            // Calculate active as CC0 + CC1
            if (coreData.cc0 !== undefined || coreData.cc1 !== undefined) {
              coreData.active = (coreData.cc0 || 0) + (coreData.cc1 || 0);
            }
          }
        }
      });
    }
  }
}

function parseFrequencyData(lines: string[], profile: Omit<GameProfile, 'insights'>): void {
  let freqStartIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('CPU P-State Average Frequency (excluding CPU idle time)')) {
      freqStartIdx = i + 1;
      break;
    }
  }

  if (freqStartIdx > 0) {
    for (let i = freqStartIdx; i < lines.length; i++) {
      if (lines[i].trim() === '' || lines[i].includes('CPU P-State/Frequency Summary')) break;
      const match = lines[i].match(/Core_(\d+).*?,\s*(\d+)/);
      if (match) {
        const coreNum = parseInt(match[1]);
        const freq = parseInt(match[2]);
        profile.avgFrequencies.push({
          core: coreNum,
          freq: freq,
          type: profile.coreTypes[coreNum] || 'Unknown'
        });
      }
    }
  }
}

function parsePackageCStates(lines: string[]): PackageCStateData | undefined {
  const packageCStates: PackageCStateData = { pc0: 0, pc2: 0, pc6: 0, pc10: 0 };
  let found = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Package C-State Summary: Residency (Percentage and Time)')) {
      // Read the next few lines for data
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const line = lines[j];
        if (line.startsWith('PC0')) {
          const match = line.match(/PC0\s*,\s*(\d+\.?\d*)/);
          if (match) { packageCStates.pc0 = parseFloat(match[1]); found = true; }
        }
        if (line.startsWith('PC2')) {
          const match = line.match(/PC2\s*,\s*(\d+\.?\d*)/);
          if (match) { packageCStates.pc2 = parseFloat(match[1]); found = true; }
        }
        if (line.startsWith('PC6')) {
          const match = line.match(/PC6\s*,\s*(\d+\.?\d*)/);
          if (match) { packageCStates.pc6 = parseFloat(match[1]); found = true; }
        }
        if (line.startsWith('PC10')) {
          const match = line.match(/PC10\s*,\s*(\d+\.?\d*)/);
          if (match) { packageCStates.pc10 = parseFloat(match[1]); found = true; }
        }
      }
      break;
    }
  }

  return found ? packageCStates : undefined;
}

function parseS0ixState(lines: string[]): S0ixState | undefined {
  const s0ixState: S0ixState = {
    slpS0Residency: 0,
    s0i2: { s0i2_0: 0, s0i2_1: 0, s0i2_2: 0 }
  };
  let found = false;

  for (let i = 0; i < lines.length; i++) {
    // Parse SLP-S0 residency
    if (lines[i].includes('SLP-S0') && lines[i].includes(',')) {
      const match = lines[i].match(/SLP-S0\s*,\s*(\d+\.?\d*)/);
      if (match) { s0ixState.slpS0Residency = parseFloat(match[1]); found = true; }
    }

    // Parse S0ix substates
    if (lines[i].startsWith('s0i2.0')) {
      const match = lines[i].match(/s0i2\.0\s*,\s*(\d+\.?\d*)/);
      if (match) { s0ixState.s0i2.s0i2_0 = parseFloat(match[1]); found = true; }
    }
    if (lines[i].startsWith('s0i2.1')) {
      const match = lines[i].match(/s0i2\.1\s*,\s*(\d+\.?\d*)/);
      if (match) { s0ixState.s0i2.s0i2_1 = parseFloat(match[1]); found = true; }
    }
    if (lines[i].startsWith('s0i2.2')) {
      const match = lines[i].match(/s0i2\.2\s*,\s*(\d+\.?\d*)/);
      if (match) { s0ixState.s0i2.s0i2_2 = parseFloat(match[1]); found = true; }
    }
  }

  return found ? s0ixState : undefined;
}

function parseWakeupData(lines: string[]): WakeupData | undefined {
  const wakeupData: WakeupData = {
    packageWakeups: [],
    coreWakeups: [],
    threadWakeups: []
  };
  let found = false;

  // Parse Package Wakeups
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Package Wakeups (OS) Summary: Type Count')) {
      for (let j = i + 2; j < Math.min(i + 20, lines.length); j++) {
        const line = lines[j];
        if (line.trim() === '' || line.includes('Summary:')) break;

        const match = line.match(/^(\w+)\s*,\s*(\d+)/);
        if (match && !match[1].includes('---')) {
          wakeupData.packageWakeups.push({
            source: match[1],
            count: parseInt(match[2])
          });
          found = true;
        }
      }
      break;
    }
  }

  return found ? wakeupData : undefined;
}

function parsePowerData(lines: string[]): PowerData | undefined {
  const powerData: PowerData = { package: 0, core: 0, gt: 0 };
  let found = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Package Power Summary: Average Rate and Total')) {
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const line = lines[j];
        if (line.includes('CPU/Package')) {
          const match = line.match(/Power\s*,\s*(\d+\.?\d*)/);
          if (match) {
            powerData.package = parseFloat(match[1]) / 1000; // Convert mW to W
            found = true;
          }
        }
      }
      break;
    }
  }

  return found ? powerData : undefined;
}

function parseThermalData(lines: string[]): ThermalData | undefined {
  const thermalData: ThermalData = {
    packageTemp: 0,
    coreTemps: []
  };
  let found = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Temperature Metrics Summary - Sampled: Min/Max/Avg')) {
      for (let j = i + 2; j < Math.min(i + 30, lines.length); j++) {
        const line = lines[j];
        if (line.trim() === '' || line.includes('Temperature Metrics Summary')) break;

        const match = line.match(/CPU\/Package_0\/Core_(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+\.?\d*)/);
        if (match) {
          const coreNum = parseInt(match[1]);
          const avgTemp = parseFloat(match[4]);
          thermalData.coreTemps.push({
            core: coreNum,
            temperature: avgTemp
          });
          found = true;
        }
      }
      break;
    }
  }

  // Calculate package temp as average of core temps
  if (thermalData.coreTemps.length > 0) {
    thermalData.packageTemp = thermalData.coreTemps.reduce((sum, c) => sum + c.temperature, 0) / thermalData.coreTemps.length;
  }

  return found ? thermalData : undefined;
}

function parseConcurrencyData(lines: string[]): ConcurrencyData | undefined {
  const concurrencyData: ConcurrencyData = {
    cpuOnly: 0,
    gpuOnly: 0,
    concurrent: 0,
    bothIdle: 0
  };
  let found = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('CPU-iGPU Concurrency Summary: Residency')) {
      for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
        const line = lines[j];
        if (line.includes('CPU-iGPU Concurrency Summary: Total')) break;

        if (line.startsWith('Both')) {
          const match = line.match(/Both\s*,\s*(\d+\.?\d*)/);
          if (match) { concurrencyData.concurrent = parseFloat(match[1]); found = true; }
        }
        if (line.startsWith('CPU Only')) {
          const match = line.match(/CPU Only\s*,\s*(\d+\.?\d*)/);
          if (match) { concurrencyData.cpuOnly = parseFloat(match[1]); found = true; }
        }
        if (line.startsWith('iGPU Only')) {
          const match = line.match(/iGPU Only\s*,\s*(\d+\.?\d*)/);
          if (match) { concurrencyData.gpuOnly = parseFloat(match[1]); found = true; }
        }
        if (line.startsWith('Both Idle') || line.startsWith('Idle')) {
          const match = line.match(/(Both Idle|Idle)\s*,\s*(\d+\.?\d*)/);
          if (match) { concurrencyData.bothIdle = parseFloat(match[2]); found = true; }
        }
      }
      break;
    }
  }

  // Calculate idle if not found (100 - sum of others)
  if (found && concurrencyData.bothIdle === 0) {
    const sum = concurrencyData.cpuOnly + concurrencyData.gpuOnly + concurrencyData.concurrent;
    if (sum < 100) {
      concurrencyData.bothIdle = 100 - sum;
    }
  }

  return found ? concurrencyData : undefined;
}
