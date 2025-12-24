// Re-export all parsers

export { parseLegacyFormat } from './legacy-parser';
export { parseComprehensiveFormat } from './comprehensive-parser';
export { detectCSVFormat, isComprehensiveFormat, type FormatDetectionResult } from './format-detector';

import { GameProfile } from '../types';
import { detectCSVFormat } from './format-detector';
import { parseLegacyFormat } from './legacy-parser';
import { parseComprehensiveFormat } from './comprehensive-parser';

// Auto-detect and parse CSV file
export const parseCSVFile = (fileContent: string, filename: string): GameProfile => {
  const formatResult = detectCSVFormat(fileContent);

  if (formatResult.format === 'comprehensive') {
    return parseComprehensiveFormat(fileContent, filename);
  }

  return parseLegacyFormat(fileContent, filename);
};
