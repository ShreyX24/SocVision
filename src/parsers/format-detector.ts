// Auto-detect CSV format based on content markers

import { CSVFormatVersion } from '../types';

export interface FormatDetectionResult {
  format: CSVFormatVersion;
  confidence: number;
  markers: string[];
}

// Markers that indicate comprehensive format
const COMPREHENSIVE_MARKERS = [
  'PCD SLP-S0 State',
  'S0ix Substate',
  'Package C-State Summary',
  'CPU-iGPU Concurrency',
  'Package Wakeups',
  'Core Wakeups',
  'Package Power Summary',
  'Temperature Metrics',
  'Platform Monitoring Technology'
];

// Markers that indicate legacy format
const LEGACY_MARKERS = [
  'Core C-State Summary: Residency',
  'CPU P-State Average Frequency'
];

export const detectCSVFormat = (fileContent: string): FormatDetectionResult => {
  const lines = fileContent.slice(0, 5000); // Check first 5000 chars for efficiency

  const foundComprehensiveMarkers: string[] = [];
  const foundLegacyMarkers: string[] = [];

  COMPREHENSIVE_MARKERS.forEach(marker => {
    if (lines.includes(marker)) {
      foundComprehensiveMarkers.push(marker);
    }
  });

  LEGACY_MARKERS.forEach(marker => {
    if (lines.includes(marker)) {
      foundLegacyMarkers.push(marker);
    }
  });

  // If we find comprehensive markers, it's the new format
  if (foundComprehensiveMarkers.length >= 3) {
    return {
      format: 'comprehensive',
      confidence: Math.min(100, foundComprehensiveMarkers.length * 15),
      markers: foundComprehensiveMarkers
    };
  }

  // If only legacy markers found
  if (foundLegacyMarkers.length > 0 && foundComprehensiveMarkers.length < 3) {
    return {
      format: 'legacy',
      confidence: foundLegacyMarkers.length * 50,
      markers: foundLegacyMarkers
    };
  }

  // Default to legacy for backwards compatibility
  return {
    format: 'legacy',
    confidence: 30,
    markers: []
  };
};

export const isComprehensiveFormat = (fileContent: string): boolean => {
  return detectCSVFormat(fileContent).format === 'comprehensive';
};
