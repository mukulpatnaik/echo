# Echo Chrome Extension

Minimal MV3 React content UI injected via background service worker.

## Structure

- `src/background/background.ts`: MV3 service worker, injects content script and CSS
- `src/content/content.tsx`: content script mounting a React widget
- `src/components/ChatWidget.tsx`: simple chat UI
- `src/styles/*.css`: styles
- `public/manifest.json`: extension manifest

## Development

1. Install deps
   - `npm install`
2. Build
   - `npm run build`
3. Load in Chrome
   - Open `chrome://extensions`
   - Enable Developer mode
   - Load unpacked -> select `dist`
