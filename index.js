'use strict';

const denodeify = require('denodeify');

const compare = require('./lib/compare');

compare('./tmp/6.png', './tmp/7.png')
	.then(sim => {
		console.log(`These two images are ${sim * 100}% similar.`);
	})
;
