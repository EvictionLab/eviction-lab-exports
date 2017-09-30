# Eviction Lab Exports

Serverless services for generating exports from Eviction Lab data.

## Installation

To install the main group of exports, run `npm install` in the root directory. Because of issues with deploying functions that use Chromeless in combination with functions that don't, the PDF export is in a separate service under the `src/pdf/` directory. To install it as well, `cd` into `src/` and run `npm install`.

## Deployment

```
npm run deploy
```