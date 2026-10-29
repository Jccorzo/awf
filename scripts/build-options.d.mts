// Types for build-options.mjs, which the build, Vitest's config and the tests share.
import type { BuildOptions, Plugin } from 'esbuild';

export const root: string;
export const rawPlugin: Plugin;
export const reportAssetsPlugin: Plugin;
export function buildReportAssets(): Promise<{ CLIENT_JS: string; CLIENT_CSS: string }>;
export function cliOptions(outfile: string): BuildOptions;
export function hookOptions(outfile: string): BuildOptions;
