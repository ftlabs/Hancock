const fs = require('fs');
const denodeify = require('denodeify');
const jimp = require('jimp');

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

function loadImage(i){
	return jimp.read(i);
}

function normaliseImage(image){

	return new Promise( resolve => {

		const normalisedSize = 500;
		
		const thisSource = image.bitmap;
		const imageWidth = thisSource.width;
		const imageHeight = thisSource.height;
		
		const d = thisSource.data;

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

			} else {
				g = 255;
			}

			d[yy] = d[yy + 1] = d[yy + 2] = g;

		}

		image.crop(l, t, r - l, b - t);
		image.resize(normalisedSize, normalisedSize);
		
		resolve(image);

	});

}

function generateProfile(image){

	return new Promise(resolve => {

		const source = image.bitmap;
		const data = {
			counts : undefined,
			firstPeak : 0,
			peaks : []
		};

		const d = source.data;
		const counts = new Array(source.width);
		
		for(let c = 0; c < counts.length; c += 1){
			counts[c] = 0;
		}

		for(let ww = 0; ww < d.length; ww += 4){
			
			const x = (ww / 4) % source.width;

			if(d[ww] === 0){

				counts[x] += 1;

			}

		}

		data.counts = counts;

		// If over 30% of the pixels in a column are black, it can be considered a peak
		const peakThreshold = source.height * 0.3 | 0;
		// The width the peak has to be in order to be considered a peak
		const peakSampleSize = 5;

		for(let f = 0; f < counts.length; f += 1){

			if(counts[f] > peakThreshold){

				const peakPoints = [];
				let wi = 0

				for(let g = f + 1; g < counts.length; g += 1 ){

					if(counts[g] > peakThreshold){
						peakPoints.push(g);
					} else {
						wi = g;
						break;
					}

				}

				if(peakPoints.length > peakSampleSize){

					const s = peakPoints.shift();
					const e = peakPoints.pop();
					const m = e - ((e - s) / 2) | 0;

					data.peaks.push({
						start : s,
						middle : m,
						end : e
					});
				}

				f += wi;

			}

		}

		data.firstPeak = data.peaks[0];
		data.isProfile = true;
		resolve(data);
	
	});

}

function compareTheData(data1, data2){

	// Dynamic Time Warping.
	// We're going to chop up our counts into 10 equal sections and shift them along the X axis
	// to a certain degree and check for a better correlation. The mean average of the best of these
	// comparisons will then be returned as the similarity value 								
	const sections = 10;
	const bestResults = [];
	const sectionSize = ((data2.counts.length / sections) | 0);
	const maxMovement = sectionSize;

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

	return Promise.resolve(similarity);

}

function compareTwoImages(image1, image2){

	const pix = [];

	if(image1.bitmap === undefined){
		pix.push(loadImage(image1));
	} else {
		pix.push( Promise.resolve(image1)); 
	}

	if(image2.bitmap === undefined){
		pix.push(loadImage(image2));
	} else {
		pix.push( Promise.resolve(image2)); 
	}

	return Promise.all(pix)
		.then( res => {

			const normalise = [normaliseImage(res[0]), normaliseImage(res[1])];
			
			return Promise.all(normalise)
				.then(normalised => {

					const profile = [ generateProfile(normalised[0]), generateProfile(normalised[1])];

					return Promise.all(profile)
						.then(profiles => {
							return comp = compareTheData(profiles[0], profiles[1]).then(sim => {
								return {
									a : image1,
									b : image2,
									similarity : sim
								};
							})
						})
					;

				})
			;

		})
	;

}

function compareOneToMany(image1, imagesArray, rank){

	return loadImage(image1)
		.then(image1 => {

			const comparisons = imagesArray.map(image => {
				return compareTwoImages(image1, image);
			})

			return Promise.all(comparisons)
				.then(comps => {
					if(rank){
						return comps.sort( (a, b) => {
							if(a.similarity > b.similarity){
								return -1;
							} else if(a.similarity < b.similarity){
								return 1;
							}
							return 0;
						});
					} else {
						return comps;
					}
				})
			;

		})
	;



}

module.exports = {
	single : compareTwoImages,
	many : compareOneToMany
};