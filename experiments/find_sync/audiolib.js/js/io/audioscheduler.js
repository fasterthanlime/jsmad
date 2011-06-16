// Requires AudioDevice

this.AudioDevice.createScheduled = function(callback){
	var	schedule	= [],
		previousCall	= 0,
		dev;

	function fn(buffer, channelCount){
		var	l		= buffer.length / channelCount,
			chunkSize	= dev.chunkSize,
			chunkLength	= chunkSize * channelCount,
			n, i, ptr;
		previousCall = +new Date;
		for (i=0; i<l; i += chunkSize){
			for (n=0; n<schedule.length; n++){
				schedule[n].t -= chunkSize;
				if (schedule[n].t <= 0){
					schedule[n].f.apply(schedule[n].x, schedule[n].a);
					schedule.splice(n--, 1);
				}
			}
			ptr = i * chunkLength;
			callback(buffer.subarray(ptr, ptr + chunkLength), channelCount);
		}
	}

	dev = this.apply(this, [fn].concat(Array.prototype.splice.call(arguments, 1)));
	dev.schedule = function(callback, context, args){
		schedule.push({
			f: callback,
			x: context,
			a: args,
			t: ((new Date - previousCall) * 0.001 * this.sampleRate)
		});
	};
	dev.chunkSize = 1;
	return dev;
};
