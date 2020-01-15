# Eviction Lab Exports

Serverless services for generating exports from Eviction Lab data.

## Installation

To install the main group of exports using Node 6, run `npm install` in the root directory. Because of issues with deploying functions that use Chromeless in combination with functions that don't, the PDF export is in a separate service under the `src/pdf/` directory. To install it as well, `cd` into `src/` and run `npm install`.

In order to test out some of the canvas-based functionality locally, you'll need to install `node-canvas` separately with `npm install canvas`.

## Development

For local testing, you can use the two commands that launch the services offline. Run each in a separate terminal window. You'll have to specify a separate port for the PDF service, so switch the `pdf_path` environment variable in use in ./serverless.yml.

```bash
npm run offline-zip
npm run offline-pdf
```

## Deployment

To deploy the service, you'll need to update the environment variables in both `serverless.yml` files.

For a dev environment run:

```bash
npm run deploy-dev
```

For a production environment run:

```bash
npm run deploy
```

## License

This application is open source code under the [MIT License](LICENSE).
