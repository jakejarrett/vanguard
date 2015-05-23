var
	settings = {},
	os = require('os'),
	data_path = global.window.nwDispatcher.requireNwGui().App.dataPath,
	path = require('path');


/** Default settings **/

// User interface
settings.language = 'en';
settings.showAdvancedsettings = false;

// Advanced UI
settings.alwaysOnTop = false;
settings.theme = 'Yosemite'; // Maybe try and implement GTK Theme support?

// Check for Connection (This will be enabled when collaboration is being developed)
// settings.connectionCheckUrl = 'http://google.com/';

// App settings
settings.version = '0.0.1';
settings.dbversion = '0.1.0';
// settings.defaultWidth = Math.round(window.screen.availWidth * 0.8);
// settings.defaultHeight = Math.round(window.screen.availHeight * 0.8);

// Miscellaneous

var Advsettings = {

	get: function (variable) {
		if (typeof settings[variable] !== 'undefined') {
			return settings[variable];
		}

		return false;
	},

	set: function (variable, newValue) {
		Database.writeSetting({
			key: variable,
			value: newValue
		})
			.then(function () {
				settings[variable] = newValue;
			});
	},

	setup: function () {
		Advsettings.performUpgrade();
		return Advsettings.getHardwareInfo();
	},

	getHardwareInfo: function () {
		if (/64/.test(process.arch)) {
			Advsettings.set('arch', 'x64');
		} else {
			Advsettings.set('arch', 'x86');
		}

		switch (process.platform) {
		case 'darwin':
			Advsettings.set('os', 'mac');
			break;
		case 'win32':
			Advsettings.set('os', 'windows');
			break;
		case 'linux':
			Advsettings.set('os', 'linux');
			break;
		default:
			Advsettings.set('os', 'unknown');
			break;
		}

		return Q();
	}
};
