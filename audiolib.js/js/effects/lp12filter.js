// Adapted from Corban Brook's dsp.js

/**
 * Creates a LP12Filter effect.
 *
 * @constructor
 * @this {LP12Filter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} cutoff (Optional) The cutoff frequency (hz).
 * @param {number} resonance (Optional) Resonance (1.0 - 20.0).
*/
function LP12Filter(samplerate, cutoff, resonance){
	var	self		= this,
		vibraSpeed	= 0,
		vibraPos	= 0,
		pi2		= Math.PI * 2,
		w, q, r, c,
		prevCut, prevReso;

	self.cutoff = !cutoff ? 20000 : cutoff; // > 40
	self.resonance = !resonance ? 1 : resonance; // 1 - 20
	self.samplerate = samplerate;

	function calcCoeff(){
		w = pi2 * self.cutoff / self.samplerate;
		q = 1.0 - w / (2 * (self.resonance + 0.5 / (1.0 + w)) + w - 2);
		r = q * q;
		c = r + 1 - 2 * Math.cos(w) * q;
	}

	self.pushSample = function(sample){
		if (prevCut !== self.cutoff || prevReso !== self.resonance){
			calcCoeff();
			prevCut = self.cutoff;
			prevReso = self.resonance;
		}
		vibraSpeed += (sample - vibraPos) * c;
		vibraPos += vibraSpeed;
		vibraSpeed *= r;
		return vibraPos;
	};

	self.getMix = function(){
		return vibraPos;
	};

	calcCoeff();
}
