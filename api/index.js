require('express');

const appModule = require('../.express/app/render.js');

module.exports = appModule.default || appModule;
