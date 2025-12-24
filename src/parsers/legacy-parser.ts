// Legacy parser for Cyberpunk.csv format (Core C-State and P-State only)

import { GameProfile, CoreStateData, ProfileMetadata } from '../types';
import { generateInsights } from '../utils/calculations';

type CoreType = 'P-Core' | 'E-Core' | 'LPE-Core';

export const parseLegacyFormat = (fileContent: string, filename: string): GameProfile => {
  const lines = fileContent.split('\n');

  const profile: Omit<GameProfile, 'insights'> = {
    name: filename.replace('.csv', '').replace(/PTATMonitor.*/, '').trim(),
    metadata: {},
    coreTypes: {},
    cStateData: [],
    avgFrequencies: [],
    formatVersion: 'legacy'
  };

  // Extract metadata
  for (let i = 0; i < Math.min(50, lines.length); i++) {
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
  }

  // Extract core types - supports both old (LNC/SKT) and new (CGC/DKT) naming
  for (let i = 0; i < lines.length; i++) {
    // Old format: Package_0/Core_0 = LNC or SKT
    const oldMatch = lines[i].match(/Package_0\/Core_(\d+) = (LNC|SKT)/);
    if (oldMatch) {
      const coreNum = parseInt(oldMatch[1]);
      profile.coreTypes[coreNum] = oldMatch[2] === 'LNC' ? 'P-Core' : 'E-Core';
    }

    // New format: Package_0/Core_0 = CGC (P Core), DKT (E Core), DKT (LPE Core)
    const newMatch = lines[i].match(/Package_0\/Core_(\d+) = \w+ \((P Core|E Core|LPE Core)\)/);
    if (newMatch) {
      const coreNum = parseInt(newMatch[1]);
      const coreTypeMap: Record<string, CoreType> = {
        'P Core': 'P-Core',
        'E Core': 'E-Core',
        'LPE Core': 'LPE-Core'
      };
      profile.coreTypes[coreNum] = coreTypeMap[newMatch[2]] || 'E-Core';
    }
  }

  // Parse C-State data
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
            if (state.includes('CC0') || state.includes('CC1')) coreData.active = residency;
            else if (state.includes('CC6')) coreData.cc6 = residency;
            else if (state.includes('CC7')) coreData.cc7 = residency;
          }
        }
      });
    }
  }

  // Parse frequency data
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

  // Merge frequency into cState
  profile.cStateData.forEach(cData => {
    const freqData = profile.avgFrequencies.find(f => f.core === cData.core);
    if (freqData) cData.freq = freqData.freq;
  });

  const insights = generateInsights(profile);
  return { ...profile, insights };
};
