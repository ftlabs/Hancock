'use strict';

const denodeify = require('denodeify');

const compare = require('../index.js');
console.time('single comparison')
compare.single('../tmp/n.jpg', '../tmp/7.png')
	.then(result => {
		console.timeEnd('single comparison');
		console.log(`${result.a} is ${result.similarity * 100}% similar to ${result.b}`);
	})
;

console.time('many comparisons');
compare.many('../tmp/n.jpg', [ '../tmp/12.png', '../tmp/7.png', '../tmp/6.png', '../tmp/m.png', '../tmp/n.jpg'], true)
	.then(res => {
		console.timeEnd('many comparisons');
		res.forEach(comparison =>{
			console.log(`${comparison.a} is ${comparison.similarity * 100}% similar to ${comparison.b}`);
		});

	})
	.catch(err => {
		console.log(err);
	})
;