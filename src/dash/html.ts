import { DASH_CSS, DASH_JS } from 'virtual:report-assets';
import { scriptJson } from '../report/html';
import type { DashData } from './data';

/**
 * One self-contained HTML file: inline CSS, JS and SVG, no network. The page draws itself from
 * the JSON embedded in it, and every filter works offline.
 */
export function renderDashHtml(data: DashData): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<meta name="generator" content="awf">
<title>awf · agent time by phase</title>
<style>${DASH_CSS}</style>
</head>
<body>
<noscript>This dashboard draws itself with JavaScript; turn it on to see your sessions.</noscript>
<div id="app"></div>
<script type="application/json" id="awf-dash">${scriptJson(data)}</script>
<script>${DASH_JS}</script>
</body>
</html>
`;
}
