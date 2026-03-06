// require('express');

// const appModule = require('../.express/app/index.js');

// module.exports = appModule.default || appModule;
require('express');

const fs = require('fs');
const path = require('path');

const candidates = [
	path.resolve(__dirname, '../.express/app/index.js'),
	path.resolve(__dirname, '../../.express/app/index.js'),
	path.resolve(process.cwd(), '.express/app/index.js'),
	path.resolve(process.cwd(), 'apps/api/.express/app/index.js'),
];

const resolvedEntry = candidates.find((filePath) => fs.existsSync(filePath));

if (!resolvedEntry) {
	throw new Error(`Cannot locate compiled API entry. Tried: ${candidates.join(', ')}`);
}

const appModule = require(resolvedEntry);

module.exports = appModule.default || appModule;
