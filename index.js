'use strict';

const denodeify = require('denodeify');

const compare = require('./lib/compare');

compare.single('./tmp/n.jpg', './tmp/7.png')
	.then(sim => {
		console.log(`These two images are ${sim * 100}% similar.`);
	})
;

console.time('many');
compare.many('./tmp/n.jpg', ['./tmp/7.png', './tmp/12.png', './tmp/6.png', './tmp/m.png'])
	.then(res => {
		console.timeEnd('many');
	})
;