// Color palettes and heatmap functions

import { ColorPalette } from '../types';

export const colorPalettes: Record<string, ColorPalette> = {
  default: {
    name: 'Teal Fresh',
    headerBg: '#4fb39c',
    headerText: '#111827',
    sidebarBg: '#89ddd6',
    buttonPrimary: '#2563eb',
    buttonSecondary: '#8b3ecf',
    buttonSuccess: '#55d355',
    buttonDanger: '#d00000',
    background: '#fffbeb',
    cardBg: '#ffffff',
    tableHeaderBg: '#4fb39c',
    tableHeaderText: '#111827',
    accentColor: '#ff6b9d'
  },
  vibrant: {
    name: 'Coral Sunset',
    headerBg: '#ff6b6b',
    headerText: '#111827',
    sidebarBg: '#ffb6b6',
    buttonPrimary: '#4ecdc4',
    buttonSecondary: '#ff6b9d',
    buttonSuccess: '#51cf66',
    buttonDanger: '#ff4757',
    background: '#fff8f0',
    cardBg: '#ffffff',
    tableHeaderBg: '#ff6b6b',
    tableHeaderText: '#111827',
    accentColor: '#ffd93d'
  },
  pastel: {
    name: 'Soft Pastels',
    headerBg: '#b4d7d8',
    headerText: '#111827',
    sidebarBg: '#e0f2f1',
    buttonPrimary: '#a6c1ee',
    buttonSecondary: '#dda6e6',
    buttonSuccess: '#c3e6c3',
    buttonDanger: '#f5b5b5',
    background: '#fefefe',
    cardBg: '#ffffff',
    tableHeaderBg: '#b4d7d8',
    tableHeaderText: '#111827',
    accentColor: '#ffd6a5'
  },
  ocean: {
    name: 'Ocean Breeze',
    headerBg: '#3b82f6',
    headerText: '#ffffff',
    sidebarBg: '#93c5fd',
    buttonPrimary: '#06b6d4',
    buttonSecondary: '#8b5cf6',
    buttonSuccess: '#10b981',
    buttonDanger: '#ef4444',
    background: '#f0f9ff',
    cardBg: '#ffffff',
    tableHeaderBg: '#3b82f6',
    tableHeaderText: '#ffffff',
    accentColor: '#fbbf24'
  },
  sunset: {
    name: 'Warm Sunset',
    headerBg: '#f97316',
    headerText: '#111827',
    sidebarBg: '#fed7aa',
    buttonPrimary: '#dc2626',
    buttonSecondary: '#c026d3',
    buttonSuccess: '#65a30d',
    buttonDanger: '#b91c1c',
    background: '#fffbeb',
    cardBg: '#ffffff',
    tableHeaderBg: '#f97316',
    tableHeaderText: '#111827',
    accentColor: '#fde047'
  }
};

// Get heatmap color based on threading ratio
export const getHeatmapColorForRatio = (ratio: number): string => {
  if (ratio < 0.95) return '#10b981'; // Green - E-Core dominant
  if (ratio > 1.05) return '#ef4444'; // Red - P-Core dominant
  return '#fbbf24'; // Yellow - Balanced
};

// Get color for activity percentage
export const getActivityColor = (activity: number): string => {
  if (activity >= 80) return '#ef4444'; // High activity - red
  if (activity >= 50) return '#f97316'; // Medium-high - orange
  if (activity >= 30) return '#fbbf24'; // Medium - yellow
  if (activity >= 10) return '#22c55e'; // Low-medium - green
  return '#10b981'; // Low - teal (good for power saving)
};

// Get color for C-State residency (higher = better for power)
export const getCStateColor = (residency: number): string => {
  if (residency >= 70) return '#10b981'; // High residency - excellent
  if (residency >= 50) return '#22c55e'; // Good
  if (residency >= 30) return '#fbbf24'; // Moderate
  if (residency >= 10) return '#f97316'; // Low
  return '#ef4444'; // Very low - concerning
};

// Get color for temperature
export const getTemperatureColor = (temp: number, tjMax: number = 100): string => {
  const percentage = (temp / tjMax) * 100;
  if (percentage >= 90) return '#ef4444'; // Critical
  if (percentage >= 75) return '#f97316'; // Hot
  if (percentage >= 60) return '#fbbf24'; // Warm
  return '#22c55e'; // Cool
};

// Get color for power consumption
export const getPowerColor = (power: number, maxPower: number): string => {
  const percentage = (power / maxPower) * 100;
  if (percentage >= 90) return '#ef4444'; // High power
  if (percentage >= 70) return '#f97316';
  if (percentage >= 50) return '#fbbf24';
  return '#22c55e'; // Low power
};

// Chart colors for P-Core and E-Core
export const coreTypeColors = {
  'P-Core': '#4338ca', // Indigo
  'E-Core': '#60a5fa', // Light blue
  'LPE-Core': '#a78bfa', // Purple
  'Unknown': '#9ca3af' // Gray
};

// Package C-State colors
export const packageCStateColors = {
  pc0: '#ef4444', // Red - active
  pc2: '#f97316', // Orange - shallow sleep
  pc6: '#22c55e', // Green - deep sleep
  pc10: '#10b981' // Teal - deepest sleep
};

// Concurrency chart colors
export const concurrencyColors = {
  cpuOnly: '#4338ca', // Blue
  gpuOnly: '#10b981', // Green
  concurrent: '#f97316', // Orange
  bothIdle: '#22c55e' // Light green
};
