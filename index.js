'use strict';

const denodeify = require('denodeify');

const compare = require('./lib/compare');

compare.single('./tmp/n.jpg', './tmp/7.png')
	.then(result => {
		// console.log(`These two images are ${sim * 100}% similar.`);
		console.log(`${result.a} is ${result.similarity * 100}% similar to ${result.b}`);
	})
;

compare.many('./tmp/n.jpg', [ './tmp/12.png', './tmp/7.png', './tmp/6.png', './tmp/m.png'], true)
	.then(res => {
		console.log(res);
	})
	.catch(err => {
		console.log(err);
	})
;