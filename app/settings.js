var settings = {},
	os = require('os');

/** Default settings **/

// User interface
settings.language = 'en';

// Advanced UI
settings.alwaysOnTop = false;
settings.theme = 'Yosemite'; // Maybe try and implement GTK Theme support?

// Check for Connection (This will be enabled when collaboration is being developed)
// settings.connectionCheckUrl = 'http://google.com/';

// App settings
settings.version = '0.0.1';
settings.dbversion = '0.1.0';
settings.defaultWidth = Math.round(window.screen.availWidth * 0.8);
settings.defaultHeight = Math.round(window.screen.availHeight * 0.8);

module.exports = settings;
