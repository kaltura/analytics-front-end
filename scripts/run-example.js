#!/usr/bin/env node

const { exec } = require('./lib/exec');
const { cleanup } = require('./lib/clean-up');

cleanup(async () => {
  await exec('git', ['checkout', '--', '.'])
});

async function main() {
  await exec('git', ['status'])
}

(async function () {
  await main();
}());

