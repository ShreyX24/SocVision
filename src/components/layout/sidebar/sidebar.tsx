import { useState } from 'react';
import { Folder, BarChart3, FileText, TrendingUp, Archive, Upload, Trash2, Edit2, Check, X } from 'lucide-react';
import { ColorPalette, SKU, GameProfile, SelectedGame, PopupState, ViewMode } from '../../../types';

interface SidebarProps {
  colors: ColorPalette;
  skus: SKU[];
  setSkus: React.Dispatch<React.SetStateAction<SKU[]>>;
  archivedSkus: SKU[];
  setArchivedSkus: React.Dispatch<React.SetStateAction<SKU[]>>;
  activeView: ViewMode;
  setActiveView: React.Dispatch<React.SetStateAction<ViewMode>>;
  selectedGame: SelectedGame | null;
  setSelectedGame: React.Dispatch<React.SetStateAction<SelectedGame | null>>;
  comparisonMode: boolean;
  setComparisonMode: React.Dispatch<React.SetStateAction<boolean>>;
  selectedGamesForComparison: Array<{ game: GameProfile; skuName: string }>;
  setSelectedGamesForComparison: React.Dispatch<React.SetStateAction<Array<{ game: GameProfile; skuName: string }>>>;
  maxComparisons: number;
  setPopup: React.Dispatch<React.SetStateAction<PopupState>>;
}

export const Sidebar = ({
  colors,
  skus,
  setSkus,
  archivedSkus,
  setArchivedSkus,
  activeView,
  setActiveView,
  selectedGame,
  setSelectedGame,
  comparisonMode,
  setComparisonMode,
  selectedGamesForComparison,
  setSelectedGamesForComparison,
  maxComparisons,
  setPopup
}: SidebarProps) => {
  const [showArchived, setShowArchived] = useState(false);
  const [renamingSkuName, setRenamingSkuName] = useState<string | null>(null);
  const [newSkuName, setNewSkuName] = useState('');

  const totalFiles = skus.reduce((sum, sku) => sum + sku.games.length, 0);
  const hasMultipleFiles = totalFiles > 1;

  // Toggle game for comparison
  const toggleGameComparison = (game: GameProfile, skuName: string) => {
    const gameId = `${skuName}-${game.name}`;
    const existingIndex = selectedGamesForComparison.findIndex(
      g => `${g.skuName}-${g.game.name}` === gameId
    );

    if (existingIndex >= 0) {
      setSelectedGamesForComparison(
        selectedGamesForComparison.filter((_, idx) => idx !== existingIndex)
      );
    } else if (selectedGamesForComparison.length < maxComparisons) {
      setSelectedGamesForComparison([...selectedGamesForComparison, { game, skuName }]);
    } else {
      setPopup({
        isOpen: true,
        title: 'Selection Limit Reached',
        message: `Maximum ${maxComparisons} games can be compared at once on your current screen size.`,
        type: 'warning',
        onConfirm: null
      });
    }
  };

  // Check if a game is selected for comparison
  const isGameSelectedForComparison = (game: GameProfile, skuName: string): boolean => {
    const gameId = `${skuName}-${game.name}`;
    return selectedGamesForComparison.some(
      g => `${g.skuName}-${g.game.name}` === gameId
    );
  };

  // Remove a specific game from a SKU
  const removeGame = (skuName: string, gameIndex: number) => {
    const updatedSkus = skus.map(sku => {
      if (sku.name === skuName) {
        const updatedGames = sku.games.filter((_, idx) => idx !== gameIndex);
        return { ...sku, games: updatedGames };
      }
      return sku;
    }).filter(sku => sku.games.length > 0);

    setSkus(updatedSkus);

    if (selectedGame && selectedGame.skuName === skuName) {
      const game = skus.find(s => s.name === skuName)?.games[gameIndex];
      if (game && selectedGame.name === game.name) {
        setSelectedGame(null);
        setActiveView('overall');
      }
    }
  };

  // Remove entire SKU directory
  const removeSku = (skuName: string) => {
    setPopup({
      isOpen: true,
      title: 'Remove Directory',
      message: `Are you sure you want to remove the entire "${skuName}" directory and all its files?`,
      type: 'warning',
      confirmText: 'Remove',
      onConfirm: () => {
        setSkus(skus.filter(sku => sku.name !== skuName));
        if (selectedGame && selectedGame.skuName === skuName) {
          setSelectedGame(null);
          setActiveView('overall');
        }
      }
    });
  };

  // Archive a SKU
  const archiveSku = (skuName: string) => {
    const skuToArchive = skus.find(sku => sku.name === skuName);
    if (!skuToArchive) return;

    setSkus(skus.filter(sku => sku.name !== skuName));
    setArchivedSkus([...archivedSkus, { ...skuToArchive, isArchived: true }]);

    if (selectedGame && selectedGame.skuName === skuName) {
      setSelectedGame(null);
      setActiveView('overall');
    }
  };

  // Unarchive a SKU
  const unarchiveSku = (skuName: string) => {
    const skuToUnarchive = archivedSkus.find(sku => sku.name === skuName);
    if (!skuToUnarchive) return;

    setArchivedSkus(archivedSkus.filter(sku => sku.name !== skuName));
    setSkus([...skus, { ...skuToUnarchive, isArchived: false }]);
  };

  // Start renaming a SKU
  const startRenamingSku = (skuName: string) => {
    setRenamingSkuName(skuName);
    setNewSkuName(skuName);
  };

  // Cancel renaming
  const cancelRenamingSku = () => {
    setRenamingSkuName(null);
    setNewSkuName('');
  };

  // Confirm rename SKU
  const confirmRenameSku = (oldSkuName: string) => {
    const trimmedName = newSkuName.trim();

    if (!trimmedName) {
      setPopup({
        isOpen: true,
        title: 'Invalid Name',
        message: 'SKU name cannot be empty.',
        type: 'error',
        onConfirm: null
      });
      return;
    }

    if (trimmedName !== oldSkuName && skus.some(sku => sku.name === trimmedName)) {
      setPopup({
        isOpen: true,
        title: 'Duplicate Name',
        message: 'A SKU with this name already exists.',
        type: 'error',
        onConfirm: null
      });
      return;
    }

    setSkus(skus.map(sku => sku.name === oldSkuName ? { ...sku, name: trimmedName } : sku));

    if (selectedGame && selectedGame.skuName === oldSkuName) {
      setSelectedGame({ ...selectedGame, skuName: trimmedName });
    }

    setSelectedGamesForComparison(
      selectedGamesForComparison.map(item =>
        item.skuName === oldSkuName ? { ...item, skuName: trimmedName } : item
      )
    );

    setRenamingSkuName(null);
    setNewSkuName('');
  };

  return (
    <div
      className="w-64 border-r-[3px] border-gray-900 h-full overflow-y-auto flex-shrink-0 sidebar-scroll"
      style={{ backgroundColor: colors.sidebarBg }}
    >
      <div className="p-4 border-b-[3px] border-gray-900" style={{ backgroundColor: colors.headerBg }}>
        <h2 className="text-xl font-black flex items-center gap-2" style={{ color: colors.headerText }}>
          <Folder className="w-5 h-5" />
          Navigation
        </h2>
      </div>

      {/* View Mode Toggle */}
      <div className="p-3 border-b-[3px] border-gray-900">
        <div className="space-y-2">
          <button
            onClick={() => setActiveView('overall')}
            className={`w-full text-left px-3 py-2 rounded-[4px] border-[3px] border-gray-900 font-bold transition-all ${
              activeView === 'overall' ? 'text-white' : 'bg-white text-gray-900'
            }`}
            style={activeView === 'overall' ? { backgroundColor: colors.buttonPrimary } : {}}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Overall Threading
          </button>
          <button
            onClick={() => setActiveView('focused')}
            disabled={!selectedGame}
            className={`w-full text-left px-3 py-2 rounded-[4px] border-[3px] border-gray-900 font-bold transition-all ${
              activeView === 'focused' ? 'text-white' : 'bg-white text-gray-900'
            } ${!selectedGame ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={activeView === 'focused' ? { backgroundColor: colors.buttonPrimary } : {}}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Focused Analysis
          </button>
          <button
            onClick={() => {
              if (hasMultipleFiles) {
                setComparisonMode(!comparisonMode);
                if (comparisonMode) {
                  setSelectedGamesForComparison([]);
                  setActiveView('overall');
                }
              }
            }}
            disabled={!hasMultipleFiles}
            className={`w-full text-left px-3 py-2 rounded-[4px] border-[3px] border-gray-900 font-bold transition-all text-white ${
              !hasMultipleFiles ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ backgroundColor: comparisonMode ? colors.buttonSuccess : colors.buttonSecondary }}
            title={`Compare up to ${maxComparisons} games`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            {comparisonMode ? `Compare (${selectedGamesForComparison.length}/${maxComparisons})` : 'Compare Mode'}
          </button>
        </div>
      </div>

      {/* Archive Toggle */}
      <div className="p-3 border-b-[3px] border-gray-900">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="w-full text-left px-3 py-2 rounded-[4px] border-[3px] border-gray-900 font-bold transition-all text-white"
          style={{ backgroundColor: colors.buttonSecondary }}
        >
          <Archive className="w-4 h-4 inline mr-2" />
          {showArchived ? 'Show Active' : `Show Archived (${archivedSkus.length})`}
        </button>
      </div>

      {/* Game List Grouped by SKU/Folder */}
      <div className="p-3">
        {showArchived ? (
          archivedSkus.length === 0 ? (
            <p className="text-sm text-gray-700 font-bold">No archived directories</p>
          ) : (
            <div className="space-y-3">
              {archivedSkus.map((sku) => (
                <div key={sku.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 uppercase flex items-center gap-1">
                      <Archive className="w-3 h-3" />
                      {sku.name}
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => unarchiveSku(sku.name)}
                        className="p-1 border-[2px] border-gray-900 rounded-[2px] hover:-translate-y-[1px] transition-all"
                        style={{ backgroundColor: colors.buttonSuccess }}
                        title="Unarchive"
                      >
                        <Upload className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={() => {
                          setPopup({
                            isOpen: true,
                            title: 'Delete Permanently',
                            message: `Are you sure you want to permanently delete "${sku.name}"? This action cannot be undone.`,
                            type: 'error',
                            confirmText: 'Delete',
                            onConfirm: () => {
                              setArchivedSkus(archivedSkus.filter(s => s.name !== sku.name));
                            }
                          });
                        }}
                        className="p-1 border-[2px] border-gray-900 rounded-[2px] hover:-translate-y-[1px] transition-all"
                        style={{ backgroundColor: colors.buttonDanger }}
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 font-bold pl-4">{sku.games.length} games</p>
                </div>
              ))}
            </div>
          )
        ) : skus.length === 0 ? (
          <p className="text-sm text-gray-700 font-bold">No games loaded</p>
        ) : (
          <div className="space-y-3">
            {skus.map((sku) => (
              <div key={sku.name} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  {renamingSkuName === sku.name ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Folder className="w-3 h-3 text-gray-900" />
                      <input
                        type="text"
                        value={newSkuName}
                        onChange={(e) => setNewSkuName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRenameSku(sku.name);
                          if (e.key === 'Escape') cancelRenamingSku();
                        }}
                        className="flex-1 text-xs font-black text-gray-900 uppercase border-[2px] border-gray-900 rounded-[2px] px-1 py-0.5"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <h3 className="text-sm font-black text-gray-900 uppercase flex items-center gap-1 flex-1">
                      <Folder className="w-3 h-3" />
                      {sku.name}
                    </h3>
                  )}
                  <div className="flex gap-1">
                    {renamingSkuName === sku.name ? (
                      <>
                        <button
                          onClick={() => confirmRenameSku(sku.name)}
                          className="p-1 border-[2px] border-gray-900 rounded-[2px] hover:-translate-y-[1px] transition-all"
                          style={{ backgroundColor: colors.buttonSuccess }}
                          title="Confirm Rename"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </button>
                        <button
                          onClick={cancelRenamingSku}
                          className="p-1 border-[2px] border-gray-900 rounded-[2px] hover:-translate-y-[1px] transition-all"
                          style={{ backgroundColor: colors.accentColor }}
                          title="Cancel"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRenamingSku(sku.name);
                          }}
                          className="p-1 border-[2px] border-gray-900 rounded-[2px] hover:-translate-y-[1px] transition-all"
                          style={{ backgroundColor: colors.buttonPrimary }}
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3 text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveSku(sku.name);
                          }}
                          className="p-1 border-[2px] border-gray-900 rounded-[2px] hover:-translate-y-[1px] transition-all"
                          style={{ backgroundColor: colors.buttonSecondary }}
                          title="Archive"
                        >
                          <Archive className="w-3 h-3 text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSku(sku.name);
                          }}
                          className="p-1 border-[2px] border-gray-900 rounded-[2px] hover:-translate-y-[1px] transition-all"
                          style={{ backgroundColor: colors.buttonDanger }}
                          title="Remove Directory"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-1 pl-1">
                  {sku.games.map((game, idx) => {
                    const isSelected = isGameSelectedForComparison(game, sku.name);
                    return (
                      <div
                        key={`${sku.name}-${game.name}-${idx}`}
                        className="flex items-center gap-2 rounded-[4px] border-[2px] border-gray-900 transition-all"
                        style={{
                          backgroundColor: comparisonMode && isSelected
                            ? colors.buttonPrimary
                            : selectedGame?.name === game.name && selectedGame?.skuName === sku.name
                            ? colors.accentColor
                            : colors.cardBg,
                          borderWidth: comparisonMode && isSelected ? '3px' : '2px'
                        }}
                      >
                        {comparisonMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGameComparison(game, sku.name);
                            }}
                            className="ml-2 w-4 h-4 rounded-[2px] border-[2px] border-gray-900 flex items-center justify-center transition-all"
                            style={{ backgroundColor: colors.cardBg }}
                            title="Select for comparison"
                          >
                            {isSelected && <div className="w-2 h-2 rounded-[1px]" style={{ backgroundColor: colors.buttonPrimary }}></div>}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (comparisonMode) {
                              toggleGameComparison(game, sku.name);
                            } else {
                              setSelectedGame({ ...game, skuName: sku.name });
                              setActiveView('focused');
                            }
                          }}
                          className={`flex-1 text-left px-3 py-2 font-bold text-sm hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all ${
                            comparisonMode && isSelected ? 'text-white' : ''
                          }`}
                        >
                          <div className="truncate">{game.name}</div>
                        </button>
                        {!comparisonMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPopup({
                                isOpen: true,
                                title: 'Remove File',
                                message: `Are you sure you want to remove "${game.name}"?`,
                                type: 'warning',
                                confirmText: 'Remove',
                                onConfirm: () => {
                                  removeGame(sku.name, idx);
                                }
                              });
                            }}
                            className="p-1 mr-1 border-[2px] border-gray-900 rounded-[2px] hover:-translate-y-[1px] transition-all"
                            style={{ backgroundColor: colors.buttonDanger }}
                            title="Remove File"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
