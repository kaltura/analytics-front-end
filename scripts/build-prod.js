const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const findRoot = require('./lib/find-root');
var execSync = require('child_process').execSync;

const paramsVersion = process.argv.find(a => a.startsWith('v'));
if (!paramsVersion) {
  throw new Error(`please, specify version as 'vx.x.x'`);
}
const versionNumber = paramsVersion.substring(1);
const zipName = `kmcAnalytics_v${versionNumber}.zip`;

// STEP: check uncommitted changes
try {
  execSync('git diff --exit-code');
}
catch (error) {
  console.error('it seems that you have un-commited changes. to perform this action you should either commit your changes or reset them. aborting action');
  process.exit(1);
}

const packageRoot = findRoot(process.cwd());
if (!packageRoot) throw new Error("couldn't find package root");

// STEP: update src/configuration/analytics-config.ts
const configFileName = "src/configuration/analytics-config.ts";
const configFilePath = path.resolve(packageRoot, configFileName);
let configData = fs.readFileSync(configFilePath, 'utf8');
const regex = /appVersion: '\d\.\d\.\d'/;
configData = configData.replace(regex, `appVersion: '${versionNumber}'`);

fs.writeFileSync(configFilePath, configData, 'utf-8');
console.log('analytics-config.ts has been updated!');

// STEP: update package.json
const packageJsonPath = path.resolve(packageRoot, 'package.json');
const packageData = fs.readFileSync(packageJsonPath);
let packageJsonObj = JSON.parse(packageData);
packageJsonObj.version = versionNumber;
packageJsonObj = JSON.stringify(packageJsonObj, null, 2);

fs.writeFileSync(packageJsonPath, packageJsonObj);
console.log('Package.json has been updated!');

// STEP: commit changed files to git
try {
  execSync(`git commit -m "bump analytics version to v${versionNumber}"`);
}
catch (error) {
  console.error('it seems that you cannot make a commit');
  process.exit(1);
}

// STEP: push commit to origin
try {
  execSync(`git push origin"`);
}
catch (error) {
  console.error('it seems that you cannot make a push');
  process.exit(1);
}

// STEP: make production build
console.log('---start production build---');
try {
  execSync('ng build --configuration=production');
}
catch (error) {
  console.error(error);
  process.exit(1);
}
console.log('---finish production build---');

// STEP: copy production build to folder v*.*.*
const dir = path.resolve(packageRoot, 'dist/v' + versionNumber);
if (fs.existsSync(dir)) {
  fs.rmdirSync(dir, {recursive: true});
}

console.log('---copy production build files---');
try {
  fse.copySync(path.resolve(packageRoot, 'dist/analytics-front-end'), dir);
  console.log('---finish production build files---');
} catch (err) {
  console.error(err);
  process.exit(1);
}

let opts = {
  "cwd": `dist`,
  "env": process.env
};

// STEP: create zip with new version
try {
  execSync(`zip -r ${zipName} v${versionNumber}/ -x "*.DS_Store" -x "__MACOSX"`, opts);
}
catch (error) {
  console.error('making zip error');
  process.exit(1);
}


// STEP: create tag with new version
try {
  execSync(`git tag v${versionNumber}`);
}
catch (error) {
  console.error('cannot create tag');
  process.exit(1);
}


// STEP: push tag to origin
try {
  execSync(`git push origin v${versionNumber}`);
}
catch (error) {
  console.error('cannot push tag');
  process.exit(1);
}

// STEP: release new version to GitHub and upload zip
const zipPath = path.resolve(packageRoot, `dist/${zipName}`);
try {
  execSync(`/usr/local/bin/gh release create v${versionNumber} ${zipPath} --draft --title "KMC Analytics v${versionNumber}"`);
}
catch (error) {
  console.error('cannot upload release');
  process.exit(1);
}

console.log(`https://github.com/kaltura/analytics-front-end/releases/tag/v${versionNumber}`);
