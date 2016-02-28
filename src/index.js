'use strict';

import PATH from 'path';

import Rx          from 'rxjs/Rx';
import Vision      from 'vision';
import Inert       from 'inert';
import HapiSwagger from 'hapi-swagger';

import Tags    from '../common/tags';
import Package from '../../package.json';

export default {

	setup: {
		config     : {},
		connection : {}
	},

	register: (server, name) => Rx.Observable.create(subscriber => {

		let response = {name:name};

		let config = {
			register : HapiSwagger,
			options  : {
				sortTags : 'name',
				info     : {
					title   : 'Test API Documentation',
					version : Package.version,
					contact : {
						name  : 'Héctor Menéndez',
						email : 'etor@gik.mx'
					}
				},
				tags: Tags
			}
		};

		server.register([Inert, Vision, config], err => {
			if (err) return subscriber.error(err);
			subscriber.next(response);
			subscriber.complete();
		});

		return ()=> {};
	})
}