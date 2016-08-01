'use strict';

const denodeify = require('denodeify');

const compare = require('./lib/compare');

compare.single('./tmp/n.jpg', './tmp/blank.png')
	.then(result => {
		// console.log(`These two images are ${sim * 100}% similar.`);
		console.log(`${result.a} is ${result.similarity * 100}% similar to ${result.b}`);
	})
;

console.time('many');
compare.many('./tmp/n.jpg', [ './tmp/12.png', './tmp/7.png', './tmp/6.png', './tmp/m.png', './tmp/n.jpg'], true)
	.then(res => {
		console.timeEnd('many');
		res.forEach(comparison =>{
			console.log(`${comparison.a} is ${comparison.similarity * 100}% similar to ${comparison.b}`);
		});

	})
	.catch(err => {
		console.log(err);
	})
;