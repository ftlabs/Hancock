'use strict';

const denodeify = require('denodeify');
const getPixels = denodeify( require('get-pixels') );
const compare = require('./lib/compare');

compare('./tmp/a.png', './tmp/a.png');

/*getPixels('./tmp/a.png').then(function(pixels) {
  console.log("got pixels", pixels.data)
});*/