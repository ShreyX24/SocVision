// UI state and component types

export type ViewMode = 'overall' | 'focused' | 'comparison' | 'power' | 'wakeup' | 'frequency';

export interface ColorPalette {
  name: string;
  headerBg: string;
  headerText: string;
  sidebarBg: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonSuccess: string;
  buttonDanger: string;
  background: string;
  cardBg: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  accentColor: string;
}

export interface PopupState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'error' | 'warning' | 'success';
  onConfirm: (() => void) | null;
  confirmText?: string;
  cancelText?: string;
}

export interface ChartTheme {
  strokeWidth: number;
  gridColor: string;
  axisColor: string;
  tooltipBg: string;
  tooltipBorder: string;
  fontSize: number;
}
