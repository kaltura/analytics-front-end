#!/usr/bin/env node

const spawnSync = require('child_process').spawnSync;
const { workspaceLibraries } = require('./definitions');

async function executeNPMLinkToLibrary(library) {
    await executeCommand('npm', ['link', library]);
}

async function main() {
    console.log(`link kaltura-ng packages`);

    for (let i = 0; i < workspaceLibraries.length; i++) {
        const library = workspaceLibraries[i];
        await executeNPMLinkToLibrary(library);
    }
}

async function executeCommand(command, commandArgs, cwd) {
  console.log(`execute command '${command} ${commandArgs.join(' ')}' ${cwd ? `cwd = ${cwd}` : ''}`);
  const result = spawnSync(command, commandArgs, {cwd, stdio: 'inherit', stderr: 'inherit'});

  if (result.status !== 0) {
    throw new Error(`execute command failed with status ${result.status}`);
  }
}

(async function() {
    await main();
}());

