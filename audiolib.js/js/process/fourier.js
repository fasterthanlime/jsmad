(function(global, Math){

// Make Math functions local.
var	sin		= Math.sin,
	cos		= Math.cos,
	sqrt		= Math.sqrt,
	floor		= Math.floor,
	pow		= Math.pow,
	ln2		= Math.ln2,
	pi		= Math.PI,
	tau		= pi * 2;

function InheritFT(obj, sampleRate, bufferSize){
	obj.sampleRate	= sampleRate;
	obj.bufferSize	= bufferSize;
	obj.bandWidth	= .5 * bufferSize * sampleRate * .5;
	obj.spectrum	= new Float32Array(bufferSize * .5);
	obj.real	= new Float32Array(bufferSize);
	obj.imag	= new Float32Array(bufferSize);
	obj.peakBand	=
	obj.peak	= 0;
	obj.getBandFrequency = function(index){
		return this.bandwidth * index + this.bandwidth * .5;
	};
	obj.calculateSpectrum = function(){
		var	self		= this,
			spectrum	= self.spectrum,
			real		= self.real,
			imag		= self.imag,
			bSi		= .5 * self.bufferSize,
			sq		= sqrt,
			N		= bufferSize * .5,
			rval, ival, mag, i;

		for (i=0; i<N; i++){
			rval	= real[i];
			ival	= imag[i];
			mag	= bSi * sq(rval * rval + ival * ival);

			if (mag > self.peak){
				self.peakBand	= i;
				self.peak	= mag;
			}
		}
	}
}

function FourierTransform(type, sampleRate, bufferSize){
	return new FourierTransform[type](sampleRate, bufferSize);
}

function DFT(sampleRate, bufferSize){
	var	self		= this,
		N		= bufferSize * bufferSize * .5,
		sinTable	= new Float32Array(N),
		cosTable	= new Float32Array(N),
		i;

	InheritFT(self, sampleRate, bufferSize);

	for (i=0; i<N; i++){
		sinTable[i] = sin(i * tau / bufferSize);
		cosTable[i] = cos(i * tau / bufferSize);
	}

	self.forward = function(buffer){
		var	self	= this,
			real	= self.real,
			imag	= self.imag,
			N	= self.bufferSize * .5,
			l	= buffer.length,
			rval, ival, k, n, kn;

		for (k=0; k<N; k++){
			rval = ival = 0.0;
			for (n=0; n<l; n++){
				rval	+= cosTable[kn = k*n]	* buffer[n];
				ival	+= sinTable[kn]		* buffer[n];
			}

			real[k]	= rval;
			imag[k] = ival;
		}

		return self.calculateSpectrum();
	}
}

global.FourierTransform	= FourierTransform;
FourierTransform.DFT	= DFT;
}(this, Math));
