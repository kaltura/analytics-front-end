const fs = require('fs');

function readFile(path) {
  return fs.readFileSync(path, 'utf-8');
}

function writeFile(path, content) {
  return fs.writeFileSync(path, content);
}

function isExists(path) {
  return fs.existsSync(path);
}

module.exports = {
  readFile,
  writeFile,
  isExists,
};
