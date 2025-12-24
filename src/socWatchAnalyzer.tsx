import React, { useState, useEffect, useMemo, memo, ChangeEvent } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Upload, X, TrendingUp, Cpu, Activity, Folder, BarChart3, FileText, Trash2, Archive, Edit2, Check, Zap, Thermometer, Power } from 'lucide-react';
import { Cards } from './components/custom/cards/cards';
import { Popup } from './components/custom/popup/popup';

// Import types
import {
  CoreStateData,
  ProfileMetadata,
  ProfileInsights,
  GameProfile,
  SelectedGame,
  SKU,
  ColorPalette,
  PopupState,
  ComparisonItem,
  ViewMode
} from './types';

// Import utilities
import { colorPalettes, getHeatmapColorForRatio, getActivityColor as getActivityColorUtil } from './utils/colors';
import { generateInsights } from './utils/calculations';

// Import parsers
import { parseCSVFile, detectCSVFormat } from './parsers';

// Import charts
import { ActivityChart, FrequencyChart, PackageStateChart, ConcurrencyChart, PowerChart, TemperatureChart, WakeupChart } from './components/charts';

// Memoized Legacy Chart Components (kept for backward compatibility)
const LegacyActivityChart = memo(({ data }: { data: CoreStateData[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeWidth={1} />
      <XAxis dataKey="core" stroke="#111827" strokeWidth={1} style={{ fontSize: '10px' }} />
      <YAxis stroke="#111827" strokeWidth={1} style={{ fontSize: '10px' }} />
      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #111827', borderRadius: '4px', fontSize: '11px' }} />
      <Bar dataKey="active" name="Active %">
        {data.map((entry, idx) => (
          <Cell key={idx} fill={entry.type === 'P-Core' ? '#4338ca' : '#60a5fa'} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
));

const LegacyFrequencyChart = memo(({ data }: { data: CoreStateData[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeWidth={1} />
      <XAxis dataKey="core" stroke="#111827" strokeWidth={1} style={{ fontSize: '10px' }} />
      <YAxis stroke="#111827" strokeWidth={1} style={{ fontSize: '10px' }} />
      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #111827', borderRadius: '4px', fontSize: '11px' }} />
      <Bar dataKey="freq" name="Frequency (MHz)">
        {data.map((entry, idx) => (
          <Cell key={idx} fill={entry.type === 'P-Core' ? '#4338ca' : '#60a5fa'} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
));

const SoCWatchAnalyzer = () => {
  // State
  const [skus, setSkus] = useState<SKU[]>([]);
  const [archivedSkus, setArchivedSkus] = useState<SKU[]>([]);
  const [activeView, setActiveView] = useState<ViewMode>('overall');
  const [selectedGame, setSelectedGame] = useState<SelectedGame | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedGamesForComparison, setSelectedGamesForComparison] = useState<ComparisonItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [renamingSkuName, setRenamingSkuName] = useState<string | null>(null);
  const [newSkuName, setNewSkuName] = useState('');
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const [userComparisonLimit, setUserComparisonLimit] = useState<number | null>(null);
  const [currentPalette, setCurrentPalette] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedPalette = localStorage.getItem('socWatchColorPalette');
      if (savedPalette && colorPalettes[savedPalette]) {
        return savedPalette;
      }
    }
    return 'default';
  });

  const year = new Date().getFullYear();
  const colors = colorPalettes[currentPalette];

  // Save palette preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('socWatchColorPalette', currentPalette);
    }
  }, [currentPalette]);

  // Calculate max comparisons based on screen width
  const screenMaxComparisons = useMemo(() => {
    const metricColumnWidth = 160;
    const comparisonColumnWidth = 230;
    const padding = 150;
    const availableWidth = screenWidth - metricColumnWidth - padding;
    const calculated = Math.floor(availableWidth / comparisonColumnWidth);
    return Math.max(2, Math.min(24, calculated));
  }, [screenWidth]);

  const maxComparisons = userComparisonLimit !== null
    ? Math.min(userComparisonLimit, screenMaxComparisons)
    : Math.min(6, screenMaxComparisons);

  // Popup state
  const [popup, setPopup] = useState<PopupState>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-trim comparison selection if it exceeds new max after resize
  useEffect(() => {
    if (selectedGamesForComparison.length > maxComparisons) {
      setSelectedGamesForComparison(selectedGamesForComparison.slice(0, maxComparisons));
      if (userComparisonLimit === null) {
        setPopup({
          isOpen: true,
          title: 'Comparison Limit Adjusted',
          message: `Screen size changed. Comparison limit reduced to ${maxComparisons} games. Some selections were removed.`,
          type: 'info',
          onConfirm: null
        });
      }
    }
  }, [maxComparisons, selectedGamesForComparison.length, userComparisonLimit]);

  // Reset user preference if screen gets too small
  useEffect(() => {
    if (userComparisonLimit !== null && userComparisonLimit > screenMaxComparisons) {
      setUserComparisonLimit(screenMaxComparisons);
    }
  }, [screenMaxComparisons, userComparisonLimit]);

  // Track if data has been loaded from localStorage
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedSkus = localStorage.getItem('socwatch_skus');
      const savedArchivedSkus = localStorage.getItem('socwatch_archived_skus');

      if (savedSkus) {
        setSkus(JSON.parse(savedSkus));
      }
      if (savedArchivedSkus) {
        setArchivedSkus(JSON.parse(savedArchivedSkus));
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    } finally {
      setIsDataLoaded(true);
    }
  }, []);

  // Save SKUs to localStorage whenever they change
  useEffect(() => {
    if (!isDataLoaded) return;
    try {
      localStorage.setItem('socwatch_skus', JSON.stringify(skus));
    } catch (error) {
      console.error('Error saving SKUs to localStorage:', error);
    }
  }, [skus, isDataLoaded]);

  // Save archived SKUs to localStorage whenever they change
  useEffect(() => {
    if (!isDataLoaded) return;
    try {
      localStorage.setItem('socwatch_archived_skus', JSON.stringify(archivedSkus));
    } catch (error) {
      console.error('Error saving archived SKUs to localStorage:', error);
    }
  }, [archivedSkus, isDataLoaded]);

  // Handle directory upload - now using the new parser
  const handleDirectoryUpload = async (event: ChangeEvent<HTMLInputElement>, skuName: string) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const games: GameProfile[] = [];
      for (const file of files) {
        if (file.name.endsWith('.csv')) {
          const content = await file.text();
          // Use the new auto-detecting parser
          const profile = parseCSVFile(content, file.name);
          games.push(profile);
        }
      }

      // Check if SKU already exists
      const existingSku = skus.find(s => s.name === skuName);
      if (existingSku) {
        setSkus(skus.map(s => s.name === skuName ? { ...s, games: [...s.games, ...games] } : s));
      } else {
        setSkus([...skus, { name: skuName, games }]);
      }
    } catch (error) {
      console.error('Error parsing files:', error);
      setPopup({
        isOpen: true,
        title: 'Error Parsing Files',
        message: 'Make sure they are Intel SoC Watch CSV files.',
        type: 'error',
        onConfirm: null
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Color gradient for heatmap
  const getActivityColor = (percentage: number): string => {
    const r = Math.round(147 - percentage * 0.81);
    const g = Math.round(197 - percentage * 1.16);
    const b = Math.round(253 - percentage * 0.51);
    return `rgb(${r}, ${g}, ${b})`;
  };

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
        message: `Maximum ${maxComparisons} games can be compared at once on your current screen size. Please deselect a game first or resize your window.`,
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

  // Sidebar with game tabs grouped by SKU/folder
  const Sidebar = () => {
    const totalFiles = skus.reduce((sum, sku) => sum + sku.games.length, 0);
    const hasMultipleFiles = totalFiles > 1;

    return (
      <div className="w-64 border-r-[3px] border-gray-900 h-full overflow-y-auto flex-shrink-0 sidebar-scroll" style={{ backgroundColor: colors.sidebarBg }}>
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
                      const isComprehensive = game.formatVersion === 'comprehensive';
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
                            <div className="truncate flex items-center gap-1">
                              {game.name}
                              {isComprehensive && (
                                <span className="text-[9px] px-1 py-0.5 bg-green-500 text-white rounded-[2px] font-black">FULL</span>
                              )}
                            </div>
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

  // Comparison View
  const ComparisonView = () => {
    const [expandedComparisonRows, setExpandedComparisonRows] = useState<Record<number, boolean>>({});

    const toggleComparisonRowExpansion = (gameIndex: number) => {
      setExpandedComparisonRows(prev => ({
        ...prev,
        [gameIndex]: !prev[gameIndex]
      }));
    };

    if (selectedGamesForComparison.length === 0) {
      return (
        <div className="p-6">
          <Cards className="p-10 text-center">
            <TrendingUp className="w-20 h-20 text-gray-900 mx-auto mb-4" />
            <h3 className="text-3xl font-black mb-2 text-gray-900">No Games Selected</h3>
            <p className="text-lg font-bold text-gray-700">Select 2-{maxComparisons} games from the sidebar to compare their threading profiles</p>
          </Cards>
        </div>
      );
    }

    const metrics = [
      { key: 'pCoreActivity', label: 'P-Core Activity (%)', format: (v: string) => v },
      { key: 'eCoreActivity', label: 'E-Core Activity (%)', format: (v: string) => v },
      { key: 'pCoreAvgFreq', label: 'P-Core Avg Freq (MHz)', format: (v: string) => v },
      { key: 'eCoreAvgFreq', label: 'E-Core Avg Freq (MHz)', format: (v: string) => v },
      { key: 'threadingRatio', label: 'P/E Ratio', format: (v: string) => v },
      { key: 'threadingModel', label: 'Threading Model', format: (v: string) => v },
      { key: 'avgCC6', label: 'Avg CC6 (%)', format: (v: string) => v },
      { key: 'avgCC7', label: 'Avg CC7 (%)', format: (v: string) => v },
    ];

    return (
      <div className="p-6 space-y-6">
        <h1 className="text-5xl font-black text-gray-900">Comparison View</h1>

        <Cards className="p-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: colors.tableHeaderBg }}>
                <th className="border-[3px] border-gray-900 px-4 py-3 text-left font-black" style={{ color: colors.tableHeaderText, minWidth: '160px' }}>Metric</th>
                {selectedGamesForComparison.map((item, idx) => (
                  <th key={idx} className="border-[3px] border-gray-900 px-4 py-3 text-center font-black" style={{ color: colors.tableHeaderText, minWidth: '200px' }}>
                    <div className="truncate">{item.game.name}</div>
                    <div className="text-xs font-bold opacity-70">{item.skuName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                  <td className="border-[3px] border-gray-900 px-4 py-3 font-black text-gray-900" style={{ backgroundColor: colors.background }}>
                    {metric.label}
                  </td>
                  {selectedGamesForComparison.map((item, colIdx) => {
                    const value = (item.game.insights as Record<string, string>)[metric.key];
                    return (
                      <td
                        key={colIdx}
                        className="border-[3px] border-gray-900 px-4 py-3 text-center font-bold"
                        style={{
                          backgroundColor: metric.key === 'threadingRatio'
                            ? getHeatmapColorForRatio(parseFloat(value))
                            : colors.cardBg
                        }}
                      >
                        {metric.format(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Cards>

        {/* Threading Ratio Legend */}
        <div className="flex items-center gap-4 text-sm font-bold text-gray-900">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#10b981] border-[2px] border-gray-900"></div>
            <span>&lt; 0.95 (Good E-Core Usage)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#fbbf24] border-[2px] border-gray-900"></div>
            <span>0.95-1.05 (Balanced)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#ef4444] border-[2px] border-gray-900"></div>
            <span>&gt; 1.05 (P-Core Dominant)</span>
          </div>
        </div>
      </div>
    );
  };

  // Overall Threading Behavior View
  const OverallView = () => {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRowExpansion = (skuName: string, gameIndex: number) => {
      const key = `${skuName}-${gameIndex}`;
      setExpandedRows(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    };

    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-5xl font-black text-gray-900">Overall Threading Behavior</h1>
        </div>

        {skus.length === 0 ? (
          <Cards className="p-10 text-center">
            <p className="text-xl font-bold text-gray-700">No data loaded</p>
          </Cards>
        ) : (
          skus.map(sku => (
            <Cards key={sku.name} className="p-6">
              <h2 className="text-3xl font-black mb-4 text-gray-900 flex items-center gap-2">
                <Cpu className="w-8 h-8" />
                {sku.name}
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-[3px] border-gray-900">
                  <thead>
                    <tr style={{ backgroundColor: colors.tableHeaderBg }}>
                      <th className="border-[3px] border-gray-900 px-4 py-3 text-left font-black" style={{ color: colors.tableHeaderText }}>Game</th>
                      <th className="border-[3px] border-gray-900 px-4 py-3 text-center font-black" style={{ color: colors.tableHeaderText }}>P-Core C0 %</th>
                      <th className="border-[3px] border-gray-900 px-4 py-3 text-center font-black" style={{ color: colors.tableHeaderText }}>E-Core C0 %</th>
                      <th className="border-[3px] border-gray-900 px-4 py-3 text-center font-black" style={{ color: colors.tableHeaderText }}>P-Core P0 (MHz)</th>
                      <th className="border-[3px] border-gray-900 px-4 py-3 text-center font-black" style={{ color: colors.tableHeaderText }}>E-Core P0 (MHz)</th>
                      <th className="border-[3px] border-gray-900 px-4 py-3 text-center font-black" style={{ color: colors.tableHeaderText }}>P/E Ratio</th>
                      <th className="border-[3px] border-gray-900 px-4 py-3 text-center font-black" style={{ color: colors.tableHeaderText }}>Model</th>
                      <th className="border-[3px] border-gray-900 px-4 py-3 text-center font-black" style={{ color: colors.tableHeaderText }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sku.games.map((game, idx) => {
                      const isExpanded = expandedRows[`${sku.name}-${idx}`];
                      const pCores = game.cStateData.filter(c => c.type === 'P-Core');
                      const eCores = game.cStateData.filter(c => c.type === 'E-Core' || c.type === 'LPE-Core');

                      return (
                        <React.Fragment key={idx}>
                          <tr className="hover:bg-[#899bdd] transition-colors">
                            <td
                              className="border-[3px] border-gray-900 px-4 py-3 font-bold text-gray-900 cursor-pointer"
                              onClick={() => {
                                setSelectedGame({ ...game, skuName: sku.name });
                                setActiveView('focused');
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {game.name}
                                {game.formatVersion === 'comprehensive' && (
                                  <span className="text-[9px] px-1 py-0.5 bg-green-500 text-white rounded-[2px] font-black">FULL</span>
                                )}
                              </div>
                            </td>
                            <td
                              className="border-[3px] border-gray-900 px-4 py-3 text-center font-black"
                              style={{
                                backgroundColor: getHeatmapColorForRatio(parseFloat(game.insights.threadingRatio)),
                                color: '#111827'
                              }}
                            >
                              {game.insights.pCoreActivity}
                            </td>
                            <td
                              className="border-[3px] border-gray-900 px-4 py-3 text-center font-black"
                              style={{
                                backgroundColor: getHeatmapColorForRatio(parseFloat(game.insights.threadingRatio)),
                                color: '#111827'
                              }}
                            >
                              {game.insights.eCoreActivity}
                            </td>
                            <td className="border-[3px] border-gray-900 px-4 py-3 text-center font-bold text-gray-900" style={{ backgroundColor: colors.background }}>
                              {game.insights.pCoreAvgFreq}
                            </td>
                            <td className="border-[3px] border-gray-900 px-4 py-3 text-center font-bold text-gray-900" style={{ backgroundColor: colors.background }}>
                              {game.insights.eCoreAvgFreq}
                            </td>
                            <td
                              className="border-[3px] border-gray-900 px-4 py-3 text-center font-black"
                              style={{
                                backgroundColor: getHeatmapColorForRatio(parseFloat(game.insights.threadingRatio)),
                                color: '#111827'
                              }}
                            >
                              {game.insights.threadingRatio}
                            </td>
                            <td className="border-[3px] border-gray-900 px-4 py-3 text-center font-bold text-gray-900">
                              {game.insights.threadingModel}
                            </td>
                            <td className="border-[3px] border-gray-900 px-4 py-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRowExpansion(sku.name, idx);
                                }}
                                className="px-3 py-1 border-[2px] border-gray-900 rounded-[4px] font-bold text-white text-sm hover:-translate-y-[1px] transition-all"
                                style={{ backgroundColor: colors.buttonPrimary }}
                              >
                                {isExpanded ? 'Hide' : 'View'}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="border-[3px] border-gray-900 px-6 py-4" style={{ backgroundColor: colors.background }}>
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="text-base font-black mb-2 text-gray-900">P-Core Individual Stats</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {pCores.map(core => (
                                        <div key={core.core} className="inline-flex items-center gap-2 border-[2px] border-gray-900 rounded-[4px] px-2 py-1" style={{ backgroundColor: colors.cardBg }}>
                                          <span className="font-bold text-gray-900 text-xs">P{core.core}</span>
                                          <div className="flex flex-col items-end">
                                            <span className="font-black text-xs" style={{ color: colors.buttonPrimary }}>C0: {core.active.toFixed(1)}%</span>
                                            <span className="font-bold text-[10px]" style={{ color: colors.accentColor }}>P0: {(core.freq || 0).toFixed(0)} MHz</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-base font-black mb-2 text-gray-900">E-Core Individual Stats</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {eCores.map(core => (
                                        <div key={core.core} className="inline-flex items-center gap-2 border-[2px] border-gray-900 rounded-[4px] px-2 py-1" style={{ backgroundColor: colors.cardBg }}>
                                          <span className="font-bold text-gray-900 text-xs">{core.type === 'LPE-Core' ? 'LPE' : 'E'}{core.core}</span>
                                          <div className="flex flex-col items-end">
                                            <span className="font-black text-xs" style={{ color: colors.buttonSecondary }}>C0: {core.active.toFixed(1)}%</span>
                                            <span className="font-bold text-[10px]" style={{ color: colors.accentColor }}>P0: {(core.freq || 0).toFixed(0)} MHz</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                {/* Extended data for comprehensive format */}
                                {game.formatVersion === 'comprehensive' && game.packageCStates && (
                                  <div className="mt-4 pt-4 border-t-[2px] border-gray-300">
                                    <h4 className="text-base font-black mb-2 text-gray-900">Package C-States</h4>
                                    <div className="grid grid-cols-4 gap-2">
                                      <div className="border-[2px] border-gray-900 rounded-[4px] px-3 py-2 text-center" style={{ backgroundColor: '#ef4444' }}>
                                        <div className="text-xs font-bold text-white">PC0</div>
                                        <div className="text-lg font-black text-white">{game.packageCStates.pc0.toFixed(1)}%</div>
                                      </div>
                                      <div className="border-[2px] border-gray-900 rounded-[4px] px-3 py-2 text-center" style={{ backgroundColor: '#f97316' }}>
                                        <div className="text-xs font-bold text-white">PC2</div>
                                        <div className="text-lg font-black text-white">{game.packageCStates.pc2.toFixed(1)}%</div>
                                      </div>
                                      <div className="border-[2px] border-gray-900 rounded-[4px] px-3 py-2 text-center" style={{ backgroundColor: '#22c55e' }}>
                                        <div className="text-xs font-bold text-white">PC6</div>
                                        <div className="text-lg font-black text-white">{game.packageCStates.pc6.toFixed(1)}%</div>
                                      </div>
                                      <div className="border-[2px] border-gray-900 rounded-[4px] px-3 py-2 text-center" style={{ backgroundColor: '#10b981' }}>
                                        <div className="text-xs font-bold text-white">PC10</div>
                                        <div className="text-lg font-black text-white">{game.packageCStates.pc10.toFixed(1)}%</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm font-bold text-gray-900">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#10b981] border-[2px] border-gray-900"></div>
                  <span>&lt; 0.95 (Good E-Core Usage)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#fbbf24] border-[2px] border-gray-900"></div>
                  <span>0.95-1.05 (Balanced)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#ef4444] border-[2px] border-gray-900"></div>
                  <span>&gt; 1.05 (P-Core Dominant)</span>
                </div>
              </div>
            </Cards>
          ))
        )}
      </div>
    );
  };

  // Focused Game Analysis View
  const FocusedView = () => {
    if (!selectedGame) {
      return (
        <div className="p-6">
          <Cards className="p-10 text-center">
            <Activity className="w-20 h-20 text-gray-900 mx-auto mb-4" />
            <h3 className="text-3xl font-black mb-2 text-gray-900">No Game Selected</h3>
            <p className="text-lg font-bold text-gray-700">Select a game from the sidebar to view detailed analysis</p>
          </Cards>
        </div>
      );
    }

    const pCores = selectedGame.cStateData.filter(c => c.type === 'P-Core');
    const eCores = selectedGame.cStateData.filter(c => c.type === 'E-Core' || c.type === 'LPE-Core');
    const isComprehensive = selectedGame.formatVersion === 'comprehensive';

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black text-gray-900 flex items-center gap-3">
              {selectedGame.name}
              {isComprehensive && (
                <span className="text-sm px-2 py-1 bg-green-500 text-white rounded-[4px] font-black">COMPREHENSIVE FORMAT</span>
              )}
            </h1>
            <p className="text-lg font-bold text-gray-700 mt-2">
              SKU: {selectedGame.skuName} | Cores: {selectedGame.metadata.totalCores} | Duration: {selectedGame.metadata.duration}s
              {selectedGame.metadata.cpuModel && ` | CPU: ${selectedGame.metadata.cpuModel}`}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <Cards className="p-6">
          <h2 className="text-2xl font-black mb-4 text-gray-900">Key Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border-[3px] border-gray-900 p-4 rounded-[4px]" style={{ backgroundColor: colors.cardBg }}>
              <div className="text-sm font-bold text-gray-600">P-Core Activity</div>
              <div className="text-2xl font-black text-gray-900">{selectedGame.insights.pCoreActivity}%</div>
            </div>
            <div className="border-[3px] border-gray-900 p-4 rounded-[4px]" style={{ backgroundColor: colors.cardBg }}>
              <div className="text-sm font-bold text-gray-600">E-Core Activity</div>
              <div className="text-2xl font-black text-gray-900">{selectedGame.insights.eCoreActivity}%</div>
            </div>
            <div className="border-[3px] border-gray-900 p-4 rounded-[4px]" style={{ backgroundColor: colors.cardBg }}>
              <div className="text-sm font-bold text-gray-600">P/E Ratio</div>
              <div className="text-2xl font-black text-gray-900">{selectedGame.insights.threadingRatio}</div>
            </div>
            <div className="border-[3px] border-gray-900 p-4 rounded-[4px]" style={{ backgroundColor: colors.cardBg }}>
              <div className="text-sm font-bold text-gray-600">Threading Model</div>
              <div className="text-xl font-black text-gray-900">{selectedGame.insights.threadingModel}</div>
            </div>
          </div>
        </Cards>

        {/* CPU Architecture Heatmap + Charts Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ alignItems: 'stretch' }}>
          {/* LEFT: CPU Architecture Heatmap */}
          <Cards className="p-6 bg-heatmap-card flex flex-col" style={{ height: '580px' }}>
            <h3 className="text-xl font-black mb-4 text-gray-900">CPU Architecture Heatmap</h3>
            <div className="bg-heatmap-bg p-5 rounded-[4px] border-[3px] border-gray-900 flex-1 flex flex-col justify-between text-poppins" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <div className="flex gap-3 mx-auto w-full" style={{ maxWidth: '480px' }}>
                {/* LEFT SIDE */}
                <div className="flex-1 flex flex-col gap-1.5">
                  {pCores[0] && (
                    <div
                      className="border-[3px] border-white rounded-[4px] flex flex-col items-center justify-center"
                      style={{
                        backgroundColor: getActivityColor(pCores[0].active),
                        height: '72px'
                      }}
                    >
                      <div className="text-base font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>P{pCores[0].core}</div>
                      <div className="text-xl font-black text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{pCores[0].active.toFixed(1)}%</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 border-[3px] border-white rounded-[4px] p-2 bg-[#1e40af]/20">
                    {eCores.slice(0, 4).map((core) => (
                      <div
                        key={core.core}
                        className="border-[2px] border-white rounded-[3px] flex flex-col items-center justify-center"
                        style={{
                          backgroundColor: getActivityColor(core.active),
                          height: '42px'
                        }}
                      >
                        <div className="text-xs font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{core.type === 'LPE-Core' ? 'LPE' : 'E'}{core.core}</div>
                        <div className="text-sm font-black text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{core.active.toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>

                  {pCores[1] && (
                    <div
                      className="border-[3px] border-white rounded-[4px] flex flex-col items-center justify-center"
                      style={{
                        backgroundColor: getActivityColor(pCores[1].active),
                        height: '68px'
                      }}
                    >
                      <div className="text-base font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>P{pCores[1].core}</div>
                      <div className="text-xl font-black text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{pCores[1].active.toFixed(1)}%</div>
                    </div>
                  )}

                  {pCores[2] && (
                    <div
                      className="border-[3px] border-white rounded-[4px] flex flex-col items-center justify-center"
                      style={{
                        backgroundColor: getActivityColor(pCores[2].active),
                        height: '68px'
                      }}
                    >
                      <div className="text-base font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>P{pCores[2].core}</div>
                      <div className="text-xl font-black text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{pCores[2].active.toFixed(1)}%</div>
                    </div>
                  )}

                  {pCores[3] && (
                    <div
                      className="border-[3px] border-white rounded-[4px] flex flex-col items-center justify-center"
                      style={{
                        backgroundColor: getActivityColor(pCores[3].active),
                        height: '72px'
                      }}
                    >
                      <div className="text-base font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>P{pCores[3].core}</div>
                      <div className="text-xl font-black text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{pCores[3].active.toFixed(1)}%</div>
                    </div>
                  )}
                </div>

                {/* CENTER - Ring Interconnect */}
                <div className="w-8 flex flex-col items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-b from-[#60a5fa] via-[#3b82f6] to-[#60a5fa] border-[2px] border-white/30 rounded-[2px] flex items-center justify-center">
                    <div className="text-[8px] font-black text-white transform -rotate-90 whitespace-nowrap">RING</div>
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="grid grid-cols-2 gap-1.5 border-[3px] border-white rounded-[4px] p-2 bg-[#1e40af]/20">
                    {eCores.slice(4, 8).map((core) => (
                      <div
                        key={core.core}
                        className="border-[2px] border-white rounded-[3px] flex flex-col items-center justify-center"
                        style={{
                          backgroundColor: getActivityColor(core.active),
                          height: '42px'
                        }}
                      >
                        <div className="text-xs font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{core.type === 'LPE-Core' ? 'LPE' : 'E'}{core.core}</div>
                        <div className="text-sm font-black text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{core.active.toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-3 text-xs font-bold text-white mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 border-[2px] border-white rounded-[2px]" style={{ backgroundColor: getActivityColor(0) }}></div>
                  <span>Low (0%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 border-[2px] border-white rounded-[2px]" style={{ backgroundColor: getActivityColor(50) }}></div>
                  <span>Med (50%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 border-[2px] border-white rounded-[2px]" style={{ backgroundColor: getActivityColor(100) }}></div>
                  <span>High (100%)</span>
                </div>
              </div>
            </div>
          </Cards>

          {/* RIGHT: Charts Section */}
          <div className="flex flex-col gap-6" style={{ height: '580px' }}>
            <Cards className="p-6">
              <h3 className="text-lg font-bold mb-3 text-gray-900">Core Activity Distribution</h3>
              <ActivityChart data={selectedGame.cStateData} height={220} />
            </Cards>

            <Cards className="p-6">
              <h3 className="text-lg font-bold mb-3 text-gray-900">Frequency by Core</h3>
              <FrequencyChart data={selectedGame.cStateData} height={220} />
            </Cards>
          </div>
        </div>

        {/* Extended Data Section for Comprehensive Format */}
        {isComprehensive && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Package C-States */}
            {selectedGame.packageCStates && (
              <Cards className="p-6">
                <h3 className="text-xl font-black mb-4 text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Package C-States
                </h3>
                <PackageStateChart data={selectedGame.packageCStates} height={200} />
              </Cards>
            )}

            {/* CPU-iGPU Concurrency */}
            {selectedGame.concurrency && (
              <Cards className="p-6">
                <h3 className="text-xl font-black mb-4 text-gray-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  CPU-iGPU Concurrency
                </h3>
                <ConcurrencyChart data={selectedGame.concurrency} height={200} />
              </Cards>
            )}

            {/* Power Data */}
            {selectedGame.powerData && (
              <Cards className="p-6">
                <h3 className="text-xl font-black mb-4 text-gray-900 flex items-center gap-2">
                  <Power className="w-5 h-5" />
                  Power Consumption
                </h3>
                <div className="text-center mb-4">
                  <div className="text-4xl font-black text-gray-900">{selectedGame.powerData.package.toFixed(2)} W</div>
                  <div className="text-sm font-bold text-gray-600">Package Power</div>
                </div>
              </Cards>
            )}

            {/* Temperature Data */}
            {selectedGame.thermalData && (
              <Cards className="p-6">
                <h3 className="text-xl font-black mb-4 text-gray-900 flex items-center gap-2">
                  <Thermometer className="w-5 h-5" />
                  Temperature
                </h3>
                <div className="text-center mb-4">
                  <div className="text-4xl font-black text-gray-900">{selectedGame.thermalData.packageTemp.toFixed(1)}°C</div>
                  <div className="text-sm font-bold text-gray-600">Avg Package Temp</div>
                </div>
                <TemperatureChart data={selectedGame.thermalData} height={150} />
              </Cards>
            )}

            {/* S0ix State */}
            {selectedGame.s0ixState && (
              <Cards className="p-6">
                <h3 className="text-xl font-black mb-4 text-gray-900">S0ix Sleep States</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-[2px] border-gray-900 rounded-[4px] p-3" style={{ backgroundColor: colors.cardBg }}>
                    <span className="font-bold">SLP-S0</span>
                    <span className="font-black text-lg">{selectedGame.s0ixState.slpS0Residency.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center border-[2px] border-gray-900 rounded-[4px] p-3" style={{ backgroundColor: colors.cardBg }}>
                    <span className="font-bold">S0i2.0</span>
                    <span className="font-black">{selectedGame.s0ixState.s0i2.s0i2_0.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center border-[2px] border-gray-900 rounded-[4px] p-3" style={{ backgroundColor: colors.cardBg }}>
                    <span className="font-bold">S0i2.1</span>
                    <span className="font-black">{selectedGame.s0ixState.s0i2.s0i2_1.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center border-[2px] border-gray-900 rounded-[4px] p-3" style={{ backgroundColor: colors.cardBg }}>
                    <span className="font-bold">S0i2.2</span>
                    <span className="font-black">{selectedGame.s0ixState.s0i2.s0i2_2.toFixed(1)}%</span>
                  </div>
                </div>
              </Cards>
            )}

            {/* Wakeup Data */}
            {selectedGame.wakeupData && selectedGame.wakeupData.packageWakeups.length > 0 && (
              <Cards className="p-6">
                <h3 className="text-xl font-black mb-4 text-gray-900">Package Wakeups</h3>
                <WakeupChart data={selectedGame.wakeupData.packageWakeups} height={200} />
              </Cards>
            )}
          </div>
        )}
      </div>
    );
  };

  // Header/Navbar with upload buttons
  const Header = () => {
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

      await handleDirectoryUpload(event, detectedFolderName);
      setFolderName('');
    };

    return (
      <div className="border-b-[4px] border-gray-900 px-6 py-3 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: colors.headerBg }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-8 h-8" style={{ color: colors.headerText }} />
            <h1 className="text-2xl font-black" style={{ color: colors.headerText }}>Intel SoC Vision</h1>
          </div>

          <div className="flex items-center gap-2 pl-6 border-l-[3px] border-gray-900">
            <span className="text-sm font-bold" style={{ color: colors.headerText }}>Color:</span>
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
            <div className="px-4 py-2 border-[3px] border-gray-900 rounded-[4px] font-bold text-white text-sm" style={{ backgroundColor: colors.buttonPrimary }}>
              {selectedGamesForComparison.length}/{maxComparisons} game{selectedGamesForComparison.length > 1 ? 's' : ''} selected
            </div>
          )}

          <label className="block">
            <div className="flex items-center gap-2 px-4 py-2 border-[3px] border-gray-900 rounded-[4px] font-bold text-white cursor-pointer hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all" style={{ backgroundColor: colors.buttonPrimary }}>
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
            <div className="flex items-center gap-2 px-4 py-2 border-[3px] border-gray-900 rounded-[4px] font-bold text-white cursor-pointer hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all" style={{ backgroundColor: colors.buttonSecondary }}>
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

  // Footer
  const Footer = () => {
    return (
      <div className="border-t-[4px] border-gray-900 px-4 py-1 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.headerBg }}>
        <p className="text-sm font-bold" style={{ color: colors.headerText }}>
          Developed by <span className="font-black">Shreyansh Tripathy & Satyajit Bhuyan</span> @ Intel SiV Gaming LAB - {year}
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden absolute inset-0" style={{ backgroundColor: colors.background }}>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          {comparisonMode ? <ComparisonView /> : activeView === 'overall' ? <OverallView /> : <FocusedView />}
        </div>
      </div>
      <Footer />
      <Popup
        isOpen={popup.isOpen}
        onClose={() => setPopup({ ...popup, isOpen: false })}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        onConfirm={popup.onConfirm || undefined}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
      />
    </div>
  );
};

export default SoCWatchAnalyzer;
