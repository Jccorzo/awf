// Provided at build time by scripts/build-options.mjs (and vitest.config.ts): the report client
// and the dashboard, bundled and minified, and their stylesheets, as strings to inline into the HTML.
declare module 'virtual:report-assets' {
  export const CLIENT_JS: string;
  export const CLIENT_CSS: string;
  export const DASH_JS: string;
  export const DASH_CSS: string;
}
