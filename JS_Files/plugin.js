

export class Plugin {
	pluginName = null;
	pluginMediaType = null;
	pluginDeviceType = null;

    /**
	 *
	 * @param {string} pluginName - Identifier for each plugin.
	 * @param {string} pluginMediaType - Types of media the plugin interfaces with (e.g. audio, video, etc).
	 * @param {string} pluginDeviceType - Types of devices the plugin interfaces with (e.g. camera, screenCapture, etc).
	 */
	constructor(pluginName, pluginMediaType, pluginDeviceType) {
		this.pluginName = pluginName;
		this.pluginMediaType = pluginMediaType;
		this.pluginDeviceType = pluginDeviceType;
	}

    init(){}

}

function init() {
	const path = require('path');
	const fs = require('fs');
	const directoryPath = "./plugins";

	fs.readdir(directoryPath, function (err, files) {
		if (err) {
			return console.log('Unable to scan plugins directory: ' + err);
		} 
		files.forEach(file => {
			console.log(file);
			const module = import('../plugins/' + file).then(m =>
				m.init()
			);
		});
	});
}

init();
