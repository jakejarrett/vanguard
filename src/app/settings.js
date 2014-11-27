var
	Settings = {},
	os = require('os'),
	data_path = global.window.nwDispatcher.requireNwGui().App.dataPath,
	path = require('path');


/** Default settings **/

// User interface
Settings.language = 'en';
Settings.coversShowRating = false;
Settings.watchedCovers = 'fade';
Settings.showAdvancedSettings = false;

// Advanced UI
Settings.alwaysOnTop = false;
Settings.theme = 'Flat_UI';
Settings.ratingStars = true; //trigger on click in details
Settings.startScreen = 'Movies';
Settings.lastTab = '';

// Check for Connection (Can Set alternate server if users wish not to use Google)
Settings.connectionCheckUrl = 'http://google.com/';

// App Settings
Settings.version = false;
Settings.dbversion = '0.1.0';
Settings.defaultWidth = Math.round(window.screen.availWidth * 0.8);
Settings.defaultHeight = Math.round(window.screen.availHeight * 0.8);

// Miscellaneous

var AdvSettings = {

	get: function (variable) {
		if (typeof Settings[variable] !== 'undefined') {
			return Settings[variable];
		}

		return false;
	},

	set: function (variable, newValue) {
		Database.writeSetting({
			key: variable,
			value: newValue
		})
			.then(function () {
				Settings[variable] = newValue;
			});
	},

	setup: function () {
		AdvSettings.performUpgrade();
		return AdvSettings.getHardwareInfo();
	},

	getHardwareInfo: function () {
		if (/64/.test(process.arch)) {
			AdvSettings.set('arch', 'x64');
		} else {
			AdvSettings.set('arch', 'x86');
		}

		switch (process.platform) {
		case 'darwin':
			AdvSettings.set('os', 'mac');
			break;
		case 'win32':
			AdvSettings.set('os', 'windows');
			break;
		case 'linux':
			AdvSettings.set('os', 'linux');
			break;
		default:
			AdvSettings.set('os', 'unknown');
			break;
		}

		return Q();
	}
};
