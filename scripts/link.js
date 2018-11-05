#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const spawnSync = require('child_process').spawnSync;
const { workspaceLibraries } = require('./definitions');
const { executeCommand } = require('./libs/utils');

async function executeNPMLinkToLibrary(library) {
  await executeCommand('npm', ['link', library]);
}

async function main() {
  console.log(`Link AnalyticsNG with local kaltura-ng`);

  for (let i = 0; i < workspaceLibraries.length; i++) {
    const library = workspaceLibraries[i];
    await executeNPMLinkToLibrary(library);
  }
}

(async function() {
  await main();
}());
