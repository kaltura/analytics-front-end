const { exec } = require('./lib/exec');
const { serve } = require('./lib/serve');
const { getArgs } = require('./lib/get-args');

async function buildProd() {
  console.log("------ Building production version, please wait... ------");
  await exec('ng', ['build', '--prod'])
}


(async function () {
  await buildProd();
  console.log("------ Loading in iframe on port 4201 ------");
  serve(getArgs().path || 'src/dev/analyticsLoaderFriendly.html');
}());

