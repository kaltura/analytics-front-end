#!/usr/bin/env node
const path = require('path');
const { exec } = require('./lib/exec');
const { cleanup } = require('./lib/clean-up');
const { srcPath } = require('./lib/definitions');
const { serve } = require('./lib/serve');
const { isExists, readFile, writeFile } = require('./lib/fs');
const { getArgs } = require('./lib/get-args');

const configPath = path.resolve(srcPath, 'configuration/analytics-config.ts');

// setup clean up handler to revert changes in frame-event-manager service after script stop
cleanup(async () => {
  await exec('git', ['checkout', '--', configPath])
});

function updateFrameEventTarget() {
  if (isExists(configPath)) {
    const content = readFile(configPath);
    // replace current origin with asterisk to avoid CORS issues with localhost
    const updatedContent = content.replace('window.location.origin', `'*'`);
    writeFile(configPath, updatedContent);
  }
}

async function main() {
  updateFrameEventTarget();
  serve(getArgs().path || 'src/dev/analyticsLoader.html');
}

(async function () {
  await main();
}());

