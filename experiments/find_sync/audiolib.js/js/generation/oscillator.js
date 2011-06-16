function Oscillator(samplerate, freq)
{
	var	phase		= 0,
		p		= 0,
		FullPI		= Math.PI * 2,
		wavetable	= new Float32Array(1),
		waveShapes;
	this.frequency = 440;
	if (freq){
		this.frequency = freq;
	}
	this.phaseOffset = 0;
	this.pulseWidth = 0.5;
	this.waveShape = 0; // ['Sine', 'Triangle', 'Pulse', 'Sawtooth', 'Invert Sawtooth', 'Square']
	this.samplerate = samplerate;
	this.generate = function(/* FM1, FM2, ... FMX */){
		var	f	= this.frequency + 0,
			pw	= this.pulseWidth,
			i, l	= arguments.length;
		for (i=0; i<l; i++){
			f += f * arguments[i];
		}
		phase = (phase + f / this.samplerate / 2) % 1;
		p = (phase + this.phaseOffset) % 1;
		p = p < pw ? p / pw : (p-pw) / (1-pw);
	};
	this.getMix = function(){
		return waveShapes[this.waveShape]();
	};
	this.getPhase = function(){
		return p;
	}; // For prototype extensions, otherwise use the p variable
	this.reset = function(){
		phase = 0.0;
	};
	this.setWavetable = function(wt){
		wavetable = wt;
		return true;
	};
	this.sine = function(){
		return Math.sin(p * FullPI);
	};
	this.triangle = function(){
		if (p < 0.5){
			return 4 * p - 1;
		}
		return 3 - 4 * p;
	};
	this.square = function(){
		return (p < 0.5) ? -1 : 1;
	};
	this.sawtooth = function(){
		return 1 - p * 2;
	};
	this.invSawtooth = function(){
		return p * 2 - 1;
	};
	this.pulse = function(){
		if (p < 0.5){
			if (p < 0.25){
				return p * 8 - 1;
			} else {
				return 1 - (p - 0.25) * 8;
			}
		}
		return -1;
	};
	this.wavetable = function(){
		return wavetable[Math.floor(p * wavetable.length)];
	};

	waveShapes = this.waveShapes = [this.sine, this.triangle, this.pulse, this.sawtooth, this.invSawtooth, this.square];
}
