'use strict';

import PATH from 'path';

import Rx          from 'rxjs/Rx';
import LoDash      from 'lodash';
import Vision      from 'vision';
import Inert       from 'inert';
import HapiSwagger from 'hapi-swagger';

const Package = require(PATH.resolve(PATH.join('.', 'package.json')));

const Setup = {
	name : 'swagger',
	conf : {}, // these will be used on hapi instantiation
	conn : {}, // These will be used on hapi connection setup
	opts : {   // These are the plugin's options
		sortTags : 'name',
		tags     : [],
		info     : {
			title   : `${Package.name}'s docs.`,
			version : Package.version,
			contact : {
				name : Package.author || 'Unknown.'
			}
		},

	},
};

export default (setup={}) => {

	setup = LoDash.merge(Setup, setup);
	setup.register = server => Rx.Observable.create(subscriber => {
		server.register([Inert, Vision, {
			register : HapiSwagger,
			options  : setup.opts
		}], err => {
			if (err) return subscriber.error(err);
			subscriber.next(setup);
			subscriber.complete();
		});

		return ()=> {};
	});

	return setup;
}