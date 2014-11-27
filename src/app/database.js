var
	async = require('async'),
	request = require('request'),
	zlib = require('zlib'),
	Datastore = require('nedb'),
	path = require('path'),
	Q = require('q'),

	db = {},
	data_path = require('nw.gui').App.dataPath,
	TTL = 1000 * 60 * 60 * 24;

console.time('App startup time');
console.debug('Database path: ' + data_path);

process.env.TZ = 'America/New_York'; // set same api tz

db.settings = new Datastore({
	filename: path.join(data_path, 'data/settings.db'),
	autoload: true
});
db.previousProjects = new Datastore({
	filename: path.join(data_path, 'data/previous.db'),
	autoload: true
});

function promisifyDatastore(datastore) {
	datastore.insert = Q.denodeify(datastore.insert, datastore);
	datastore.update = Q.denodeify(datastore.update, datastore);
	datastore.remove = Q.denodeify(datastore.remove, datastore);
}

promisifyDatastore(db.settings);
promisifyDatastore(db.previousProjects);

// settings key uniqueness
db.settings.ensureIndex({
	fieldName: 'key',
	unique: true
});

// This utilizes the exec function on nedb to turn function calls into promises
var promisifyDb = function (obj) {
	return Q.Promise(function (resolve, reject) {
		obj.exec(function (error, result) {
			if (error) {
				return reject(error);
			} else {
				return resolve(result);
			}
		});
	});
};

var Database = {


	getSetting: function (data) {
		return promisifyDb(db.settings.findOne({
			key: data.key
		}));
	},

	getSettings: function () {
		win.debug('getSettings() fired');
		return promisifyDb(db.settings.find({}));
	},

	// format: {key: key_name, value: settings_value}
	writeSetting: function (data) {
		return Database.getSetting({
				key: data.key
			})
			.then(function (result) {
				if (result) {
					return db.settings.update({
						'key': data.key
					}, {
						$set: {
							'value': data.value
						}
					}, {});
				} else {
					return db.settings.insert(data);
				}
			});
	},

	resetSettings: function () {
		return db.settings.remove({}, {
			multi: true
		});
	},

	deleteDatabases: function () {

		fs.unlinkSync(path.join(data_path, 'data/settings.db'));

		fs.unlinkSync(path.join(data_path, 'data/previousProjects.db'));

		return Q.Promise(function (resolve, reject) {
			var req = indexedDB.deleteDatabase(App.Config.cache.name);
			req.onsuccess = function () {
				resolve();
			};
			req.onerror = function () {
				resolve();
			};
		});

	},

	initialize: function () {
		// we'll intiatlize our settings and our API SSL Validation
		// we build our settings array
		return Database.getUserInfo()
			.then(function () {
				return Database.getSettings();
			})
			.then(function (data) {
				if (data != null) {
					for (var key in data) {
						Settings[data[key].key] = data[key].value;
					}
				} else {
					win.warn('is it possible to get here');
				}

				// new install?
				if (Settings.version === false) {
					window.__isNewInstall = true;
				}
            
			})
			.then(function () {
				// set app language
				detectLanguage(Settings.language);
				// set hardware settings and usefull stuff
				return AdvSettings.setup();
			})
			.then(function () {
				App.Trakt = App.Config.getProvider('metadata');
				// check update
				var updater = new App.Updater();
				updater.update()
					.catch(function (err) {
						win.error(err);
					});
				// we skip the initDB (not needed in current version)
			})
			.catch(function (err) {
				win.error('Error starting up');
				win.error(err);
			});
	}
};