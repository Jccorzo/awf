/** One phase, as `awf summary --json` gives it. */
export type PhaseRow = { phase: string; label: string; ms: number; share: number };

export type Stats = {
  totalMs: number;
  toolCalls: number;
  modelCalls: number;
  failures: number;
  tokensIn: number;
  tokensOut: number;
  phases: PhaseRow[];
  /** When awf read these, ms since the epoch. */
  atMs: number;
};

/** What the pane draws: the last stats awf gave, and why the latest read failed. */
export type PanelView = { stats?: Stats; error?: string };

declare module 'claude-code' {
  interface PluginState {
    awf: { view: Shaped<PanelView> };
  }
}
