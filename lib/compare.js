const fs = require('fs');
const denodeify = require('denodeify');
const getPixels = denodeify( require('get-pixels') );
const savePixels = require('save-pixels');

// correlate function based on Coffeescript found at https://gist.github.com/anonymous/150bfe1702811808dbf3
const correlate = (function(xs, ys){

	return coletiance(xs, ys) / (stdDev(xs) * stdDev(ys));

	function coletiance (xs, ys) {
		let mx, my, ref;
		ref = [mean(xs), mean(ys)], mx = ref[0], my = ref[1];
		return mean(zipWith(xs, ys, function(x, y) {
			return (x - mx) * (y - my);
		}));
	}

	function stdDev (xs) {
		let mx;
		mx = mean(xs);
		return Math.sqrt(mean(map(xs, function(x) {
			return Math.pow(x - mx, 2);
		})));
	}

	function mean (xs) {
		return sum(xs) / xs.length;
	}

	function sum (xs) {
		return xs.reduce((function(a, b) {
			return a + b;
		}), 0);
	}

	function zipWith (xs, ys, fn) {
		return map(zip(xs, ys), function(arg) {
			let x, y;
			x = arg[0], y = arg[1];
			return fn(x, y);
		});
	}

	function zip (xs, ys) {
		return map(range(Math.min(xs.length, ys.length)), function(i) {
			return [xs[i], ys[i]];
		});
	}

	function map (xs, fn) {
		return xs.map(fn);
	}

	function range (start, stop, step) {
		let j, ref, ref1, results;
		if (stop == null) {
			stop = start;
		}
		if (step == null) {
			step = 1;
		}
		if (arguments.length === 1) {
			start = 0;
		}
		return (function() {
			results = [];
			for (let j = ref = start / step, ref1 = stop / step; ref <= ref1 ? j < ref1 : j > ref1; ref <= ref1 ? j++ : j--){ results.push(j); }
			return results;
		}).apply(this).map(function(i) {
			return Math.floor(i * step);
		});
	}
});

let c1 = undefined;
let c2 = undefined;

let analyserCanvas = undefined;
let aCtx = undefined;

let normaliserCanvas = undefined;
let nCtx = undefined;

function normaliseImage(image){

	let thisSource = image;
	console.log(thisSource);
	let imageWidth = thisSource.shape[0];
	let imageHeight = thisSource.shape[1];

	let d = thisSource.data;

	let t = imageHeight;
	let l = imageWidth;
	let r = 0;
	let b = 0;
	
	for(let yy = 0; yy < d.length; yy += 4){
		
		const x = (yy / 4) % imageWidth;
		const y = ( (yy / 4) / imageWidth) | 0;

		let g = parseInt((d[yy] + d[yy + 1] + d[yy + 2]) / 3);

		if(g < 128){
			g = 0;
			
			if(x < l){
				l = x
			}

			if(x > r){
				r = x;
			}

			if(y < t){
				t = y;
			}

			if(y > b){
				b = y;
			}

			// counts[x] += 1;

		} else {
			g = 255;
		}

		d[yy] = d[yy + 1] = d[yy + 2] = g;

	}

	const cropped = new Uint8Array( (r - l) * (b - t) * 4 );
	let cIdx = 0;

	for(let i = 0; i < d.length; i += 4 ){
		const x = (i / 4) % imageWidth;
		const y = ( (i / 4) / imageWidth) | 0;
			
		if(x >= l && x <= r && y >= t && y <= b){
			cropped[cIdx] = d[i];
			cropped[cIdx + 1] = d[i + 1];
			cropped[cIdx + 2] = d[i + 2];
			cropped[cIdx + 3] = d[i + 3];
			cIdx += 4;
		}

	}

	imageWidth = r - l;
	imageHeight = b - t;

	let imageSize = 500;

	imageWidth = imageSize;
	imageHeight = imageSize;

	// nCtx.drawImage(image, 0, 0, imageSize, imageSize);
	// image.src = normaliserCanvas.toDataURL('image/png');

	return cropped;

}

function generateProfile(image){

	let source = image;
	const data = {
		counts : undefined,
		scaledCounts : undefined,
		firstPeak : 0,
		peaks : []
	};

	analyserCanvas.width = source.width;
	analyserCanvas.height = source.height;

	aCtx.drawImage(source, 0, 0);

	let pixelData = aCtx.getImageData(0,0,analyserCanvas.width, analyserCanvas.height);
	let d = pixelData.data;

	let counts = new Array(analyserCanvas.width);
	
	for(let c = 0; c < counts.length; c += 1){
		counts[c] = 0;
	}

	for(let ww = 0; ww < d.length; ww += 4){
		
		let x = (ww / 4) % analyserCanvas.width;

		if(d[ww] === 0){

			counts[x] += 1;

		}

	}

	data.counts = counts;

	// If over 30% of the pixels in a column are black, it can be considered a peak
	let peakThreshold = source.height * 0.3 | 0;
	// The width the peak has to be in order to be considerd a peak
	let peakSampleSize = 5;

	for(let f = 0; f < counts.length; f += 1){

		if(counts[f] > peakThreshold){

			let peakPoints = [];

			for(let g = f + 1; g < counts.length; g += 1 ){

				if(counts[g] > peakThreshold){
					peakPoints.push(g);
				} else {
					break;
				}

			}

			if(peakPoints.length > peakSampleSize){

				let s = peakPoints.shift();
				let e = peakPoints.pop();
				let m = e - ((e - s) / 2) | 0;

				data.peaks.push({
					start : s,
					middle : m,
					end : e
				});
			}

			f += g;

		}

	}

	// console.log(data.peaks);

	data.firstPeak = data.peaks[0];

	return data;

}

function compareTheData(data1, data2){

	// Dynamic Time Warping.
	// We're going to chop up our counts into 10 equal sections and shift them along the X axis
	// to a certain degree and check for a better correlation. The mean average of the best of these
	// comparisons will then be returned as the similarity value 								
	let sections = 10;
	let bestResults = [];
	let sectionSize = ((data2.counts.length / sections) | 0);
	let maxMovement = sectionSize;

	for(let f = 0; f < sections - 1; f += 1){

		const offset = ((data2.counts.length / sections) | 0) * f;
		const shiftees = data2.counts.slice( offset, offset + sectionSize );
		
		let bestSimilarity = 0;

		for(let g = -maxMovement; g < maxMovement; g += 1){

			const comparitiveChunk = data1.counts.slice( offset + g, (offset + g) + sectionSize );

			let v = correlate( shiftees, comparitiveChunk ); 

			if(v > bestSimilarity){
				bestSimilarity = v;
			}

		}

		bestResults.push(bestSimilarity);

	}

	const similarity = bestResults.reduce(function(a, b) { return a + b; }, 0) / bestResults.length;

	return similarity;

}

function compareTwoImages(image1, image2){

	const pix = [ getPixels(image1), getPixels(image2) ];

	return Promise.all(pix)
		.then( res => {
	
			// const d1 = generateProfile( normaliseImage( res[0] ) );
			// const d2 = generateProfile( normaliseImage( res[1] ) );

			normaliseImage(res[0]);
			// return true;
			// const result = compareTheData(d1, d2);

			// return result;
		} ).catch(err => {
			console.log(err);
		})
	;

}


module.exports = compareTwoImages;