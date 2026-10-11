/** Shared engine result types (kept separate so engineService can re-export). */

export interface EngineFinding {
  element: string;
  fg: string;
  bg: string;
  ratio: number;
  large: boolean;
  aa: boolean;
  aaa: boolean;
  suggestion?: string;
}

export interface EngineIssue {
  severity: 'error' | 'warning';
  message: string;
}

export interface EngineValidation {
  issues: EngineIssue[];
}

export interface EngineReport {
  findings: EngineFinding[];
}

export type OutputFormat = 'standalone' | 'wordpress';