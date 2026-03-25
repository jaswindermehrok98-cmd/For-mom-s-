export type Page = 'sanctuary' | 'vision' | 'nourish' | 'kinetic' | 'ledger' | 'sensor' | 'fitness';

export interface EnvironmentData {
  light: number;
  noise: number;
  airQuality: number;
}

export interface UserMood {
  harmony: number;
  stress: number;
}

export interface VitalStats {
  heartRate: number;
  glucose: number;
  habits: number;
}
