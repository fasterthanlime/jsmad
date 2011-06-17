/**
 * Creates an AllPassFilter effect.
 *
 * @constructor
 * @this {AllPassFilter}
 * @param {number} sampleRate Sample Rate (hz).
 * @param {number} maxDelay The maximum delay (spl).
 * @param {number} delay The delay (spl).
 * @param {number} volume Effect intensity (unsigned double).
*/

function AllPassFilter(sampleRate, maxDelay, delay, volume){
	var	self		= this,
		buffer		= new Float32Array(maxDelay),
		bufferMax	= maxDelay - 1,
		inputPointer	= delay,
		outputPointer	= 0,
		sample		= 0.0;

	this.volume	= self.volume || 1;

	self.sampleRate = sampleRate;

	self.pushSample	= function(s){
		buffer[inputPointer++] = s;
		sample	= buffer[outputPointer++] * self.volume;
		if (inputPointer	>= bufferMax){
			inputPointer	= 0;
		}
		if (outputPointer	>= bufferMax){
			outputPointer	= 0;
		}
		return sample;
	}

	self.getMix = function(){
		return sample;
	}
}
