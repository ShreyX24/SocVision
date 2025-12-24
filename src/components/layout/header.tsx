import { useState, ChangeEvent } from 'react';
import { Cpu, Folder, Upload } from 'lucide-react';
import { ColorPalette, GameProfile } from '../../types';
import { colorPalettes } from '../../utils/colors';

interface HeaderProps {
  colors: ColorPalette;
  currentPalette: string;
  setCurrentPalette: (palette: string) => void;
  comparisonMode: boolean;
  selectedGamesForComparison: Array<{ game: GameProfile; skuName: string }>;
  maxComparisons: number;
  isProcessing: boolean;
  onDirectoryUpload: (event: ChangeEvent<HTMLInputElement>, skuName: string) => Promise<void>;
}

export const Header = ({
  colors,
  currentPalette,
  setCurrentPalette,
  comparisonMode,
  selectedGamesForComparison,
  maxComparisons,
  isProcessing,
  onDirectoryUpload
}: HeaderProps) => {
  const [folderName, setFolderName] = useState('');

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    let detectedFolderName = folderName.trim();
    if (!detectedFolderName && files.length > 0) {
      const file = files[0] as File & { webkitRelativePath?: string };
      if (file.webkitRelativePath) {
        const pathParts = file.webkitRelativePath.split('/');
        if (pathParts.length > 1) {
          detectedFolderName = pathParts[0];
        }
      }
    }

    if (!detectedFolderName) {
      detectedFolderName = 'Untitled';
    }

    await onDirectoryUpload(event, detectedFolderName);
    setFolderName('');
  };

  return (
    <div
      className="border-b-[4px] border-gray-900 px-6 py-3 flex items-center justify-between flex-shrink-0"
      style={{ backgroundColor: colors.headerBg }}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Cpu className="w-8 h-8" style={{ color: colors.headerText }} />
          <h1 className="text-2xl font-black" style={{ color: colors.headerText }}>
            Intel SoC Vision
          </h1>
        </div>

        <div className="flex items-center gap-2 pl-6 border-l-[3px] border-gray-900">
          <span className="text-sm font-bold" style={{ color: colors.headerText }}>
            Color:
          </span>
          {Object.keys(colorPalettes).map((paletteKey) => {
            const palette = colorPalettes[paletteKey];
            return (
              <button
                key={paletteKey}
                onClick={() => setCurrentPalette(paletteKey)}
                className={`w-10 h-10 rounded-[4px] border-[3px] border-gray-900 transition-all hover:-translate-y-[1px] ${
                  currentPalette === paletteKey ? 'ring-4 ring-offset-2 ring-gray-900' : ''
                }`}
                style={{ backgroundColor: palette.headerBg }}
                title={palette.name}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {comparisonMode && selectedGamesForComparison.length > 0 && (
          <div
            className="px-4 py-2 border-[3px] border-gray-900 rounded-[4px] font-bold text-white text-sm"
            style={{ backgroundColor: colors.buttonPrimary }}
          >
            {selectedGamesForComparison.length}/{maxComparisons} game{selectedGamesForComparison.length > 1 ? 's' : ''} selected
          </div>
        )}

        <label className="block">
          <div
            className="flex items-center gap-2 px-4 py-2 border-[3px] border-gray-900 rounded-[4px] font-bold text-white cursor-pointer hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
            style={{ backgroundColor: colors.buttonPrimary }}
          >
            <Folder className="w-5 h-5" />
            Select Folder
          </div>
          <input
            type="file"
            className="hidden"
            accept=".csv"
            multiple
            {...{ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>}
            onChange={handleFileSelection}
            disabled={isProcessing}
          />
        </label>
        <label className="block">
          <div
            className="flex items-center gap-2 px-4 py-2 border-[3px] border-gray-900 rounded-[4px] font-bold text-white cursor-pointer hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
            style={{ backgroundColor: colors.buttonSecondary }}
          >
            <Upload className="w-5 h-5" />
            Select Files
          </div>
          <input
            type="file"
            className="hidden"
            accept=".csv"
            multiple
            onChange={handleFileSelection}
            disabled={isProcessing}
          />
        </label>
      </div>
    </div>
  );
};
