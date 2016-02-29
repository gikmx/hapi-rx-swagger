'use strict';

import PATH from 'path';
import FS   from 'fs';

import LoDash from 'lodash';

export default (server, setup) => {

	setup = LoDash.merge({
		extname    : '.js',
		validators : ['query', 'params','headers', 'payload'],
		aliases    : [ {title:'description'}, {description:'notes'} ],
		path       : './routes',
		root       : PATH.dirname(require.main.filename),
		params     : {}
	}, setup);

	let root = PATH.resolve(PATH.join(setup.root, setup.path));

	return (function HapiPath(path){
		let dir;
		try {
			dir = FS.readdirSync(path);
		} catch (e){
			throw new Error(`Invalid routes directory: ${e.message}`);
		}
		dir.forEach(filename => {
			filename = PATH.join(path, filename);
			// be lazy and recursive on directories
			if (FS.statSync(filename).isDirectory()) return HapiPath(filename);
			// omit files with unrecognized extension
			if (PATH.extname(filename) !== setup.extname) return;
			// Require module (watch out for the caveat for es6 import statement)
			let module = (require(filename)).default;
			if (!LoDash.isPlainObject(module))
				throw `${filename} expected object, got ${typeof module}.`;
			// we've got the route module ready, prepare the stage
			let route = {
				method : PATH.basename(filename, setup.extname).toUpperCase().trim(),
				path   : PATH.sep + PATH.dirname(PATH.relative(root, filename))
					.toLowerCase()
					.replace(/^(root|\.)/,''),
				config : {
					handler  : module.handler,
					tags     : ['api'],
					validate : {},
					plugins  : {}
				}
			};
			// Replace aliases
			if (!LoDash.isPlainObject(module.info)) module.info = {};
			setup.aliases.forEach(alias => {
				let key = Object.keys(alias)[0];
				if (module.info[key]){
					route.config[alias[key]] = module.info[key];
					delete  module.info[key];
				}
			});
			// Populate plugins object
			if (LoDash.isPlainObject(module.plugins))
				Object.assign(route.config.plugins, module.plugins);
			route.config.plugins['hapi-swagger'] = module.info;
			// transform validator shorthands
			setup.validators.forEach(type => {
				if (LoDash.isPlainObject(module[type]))
					route.config.validate[type] = module[type];
			});
			// validate that parameters declared on path actually exist.
			let match = route.path.match(/\{([a-z]+)\}/i);
			if (match) {
				if (!setup.params[match[1]])
					throw `${route.path}: Undeclared param (${match[1]}).`;
				if (!route.config.validate.params) route.config.validate.params = {};
				route.config.validate.params[match[1]] = setup.params[match[1]];
			};
			// enable route on server
			server.route(route);
		});
	})(root);
}
