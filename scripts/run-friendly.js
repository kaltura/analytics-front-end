const { exec } = require('./lib/exec');
const { serve } = require('./lib/serve');
const { getArgs } = require('./lib/get-args');
const { isExists, readFile, writeFile } = require('./lib/fs');
const { srcPath } = require('./lib/definitions');
const path = require('path');
const configPath = path.resolve(srcPath, 'configuration/analytics-config.ts');

async function buildProd() {
  console.log("------ Building production version, please wait... ------");
  await exec('ng', ['build', '--prod'])
}

function updateFrameEventTarget() {
  if (isExists(configPath)) {
    const content = readFile(configPath);
    // replace current origin with asterisk to avoid CORS issues with localhost
    const updatedContent = content.replace('window.location.origin', `'*'`);
    writeFile(configPath, updatedContent);
  }
}

(async function () {
  updateFrameEventTarget();
  await buildProd();
  console.log("------ Production build ready, Launching on port 4200 ------");
  serve('dist/analytics-front-end/index.html', 4200);
  console.log("------ Loading in iframe on port 4201 ------");
  serve(getArgs().path || 'src/dev/analyticsLoaderFriendly.html');
  console.log("------ All is ready. Open http://localhost:4201 ------");
}());

