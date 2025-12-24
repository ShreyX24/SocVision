// Core C-State types for CPU core data

export interface CoreStateData {
  core: number;
  type: 'P-Core' | 'E-Core' | 'LPE-Core' | 'Unknown';
  active: number;
  cc0?: number;
  cc1?: number;
  cc6: number;
  cc7: number;
  freq?: number;
  cc0EntryCount?: number;
  cc1EntryCount?: number;
  cc6EntryCount?: number;
  cc7EntryCount?: number;
}

export interface OsCStateData {
  core: number;
  c1: number;
  c6: number;
  c8: number;
  c10: number;
  c1EntryCount?: number;
  c6EntryCount?: number;
  c8EntryCount?: number;
  c10EntryCount?: number;
}
