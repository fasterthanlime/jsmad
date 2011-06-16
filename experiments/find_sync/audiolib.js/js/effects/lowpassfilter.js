// A simple and fast low pass filter. Also low quality...

/**
 * Creates a LowPassFilter effect.
 *
 * @constructor
 * @this {LowPassFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} freq (Optional) The cutoff frequency (hz).
 * @param {number} reso (Optional) Resonance (unsigned double).
*/
function LowPassFilter(samplerate, freq, reso){
	var	self	= this,
		smpl	= [0.0, 0.0];
	self.cutoff	= !freq ? 20000 : freq; // > 40
	self.resonance	= !reso ? 0.0 : reso; // 0.0 - 1.0
	self.samplerate	= samplerate;

	self.pushSample = function(s){
		var	cut_lp	= self.cutoff * 2 / self.samplerate,
			fb_lp	= self.resonance + self.resonance / (1-cut_lp);
		smpl[0] = smpl[0] + cut_lp * (s - smpl[0] + fb_lp * (smpl[0] - smpl[1]));
		smpl[1] = smpl[1] + cut_lp * (smpl[0] - smpl[1]);
		return smpl[1];
	};

	self.getMix = function(){
		return smpl[1];
	};
}
