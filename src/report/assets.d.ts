// Provided at build time by scripts/build-options.mjs (and vitest.config.ts): the report client,
// bundled and minified, and its stylesheet, as strings to inline into the HTML.
declare module 'virtual:report-assets' {
  export const CLIENT_JS: string;
  export const CLIENT_CSS: string;
}
