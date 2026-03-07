require('express');

// const appModule = require('../.express/app/index.js');
const appModule = __importDefault(require("../.express/app/index.js"));
// const appModule = require('/var/task/apps/api/api/index.js');

module.exports = appModule.default || appModule;