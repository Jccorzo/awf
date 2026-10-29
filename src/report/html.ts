import { CLIENT_CSS, CLIENT_JS } from 'virtual:report-assets';
import type { ReportData } from './data';

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** JSON that is safe inside a <script> element: no `</script>`, `<!--` or line separators. */
export function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * One self-contained HTML file: inline CSS, JS and SVG, no network. The page draws itself from
 * the JSON embedded in it.
 */
export function renderReportHtml(data: ReportData): string {
  const title = data.share
    ? `awf · session ${data.session.id}`
    : `awf · ${data.session.title ?? `session ${data.session.id.slice(0, 8)}`}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<meta name="generator" content="awf">
<title>${escapeHtml(title.length > 90 ? title.slice(0, 89) + '…' : title)}</title>
<style>${CLIENT_CSS}</style>
</head>
<body>
<noscript>This report draws itself with JavaScript; turn it on to see the waterfall.</noscript>
<div id="app"></div>
<script type="application/json" id="awf-data">${scriptJson(data)}</script>
<script>${CLIENT_JS}</script>
</body>
</html>
`;
}
