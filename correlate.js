// correlate function based on Coffeescript found at https://gist.github.com/anonymous/150bfe1702811808dbf3
module.exports = function(xs, ys){

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
			return (x - mx) * (x - mx); 
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
		let j, ref, results;
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
			for (let j = ref = start / step, ref1 = stop / step; ref <= ref1 ? j < ref1 : j > ref1; ref <= ref1 ? j += 1 : j -= 1){ results.push(j); }
			return results;
		}).apply(this).map(function(i) {
			return (i * step) | 0;
		});
	}
};