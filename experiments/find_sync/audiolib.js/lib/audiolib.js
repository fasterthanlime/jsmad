/*
	audiolib.js
	Jussi Kalliokoski
	https://github.com/jussi-kalliokoski/audiolib.js
	MIT license
*/

/*
	wrapper-start.js
	Please note that the file is not of valid syntax when standalone.
*/

this.audioLib = (function(global, Math){

var	arrayType	= global.Float32Array || Array,
	audioLib	= this;

function Float32Array(length){
	var array = new arrayType(length);
	array.subarray = array.subarray || array.slice;
	return array;
}

audioLib.Float32Array = Float32Array;
/**
 * Creates an ADSR envelope.
 *
 * @constructor
 * @this {ADSREnvelope}
 * @param {number} sampleRate Sample Rate (hz).
 * @param {number} attack (Optional) Attack (ms).
 * @param {number} decay (Optional) Decay (ms).
 * @param {number} sustain (Optional) Sustain (unsigned double).
 * @param {number} release (Optional) Release (ms).
*/
function ADSREnvelope(sampleRate, attack, decay, sustain, release){
	this.attack	= attack	|| 50; // ms
	this.decay	= decay		|| 50; // ms
	this.sustain	= sustain	|| 1; // 0.0 - 1.0
	this.release	= release	|| 50; // ms

	this.value = 0;

	var	self	= this,
		state	= 3,
		gate	= false,
		states	= [function(){ // 0: Attack
				self.value += 1000 / self.sampleRate / self.attack;
				if (self.value >= 1){
					state = 1;
				}
			}, function(){ // 1: Decay
				self.value -= 1000 / self.sampleRate / self.decay * self.sustain;
				if (self.value <= self.sustain){
					state = 2;
				}
			}, function(){ // 2: Sustain
				self.value = self.sustain;
			}, function(){ // 3: Release
				self.value = Math.max(0, self.value - 1000 / self.sampleRate / self.release);
		}];

	this.generate = function(){
		states[state]();
		return this.value;
	};

	this.triggerGate = function(open){
		gate = open;
		state = gate ? 0 : 3;
	}

	this.sampleRate = sampleRate;
}
/**
 * Creates a MidiEventTracker to control voices from MIDI events.
 *
 * @constructor
 * @this MidiEventTracker
*/

function MidiEventTracker(){
	var	self		= this,
		pressedKeys	= [];
	this.velocity = 0; // 0.0 - 1.0
	this.legato = 0; // ['Last', 'Lowest', 'Highest']
	this.retrigger = 0; // ['Always', 'First Note']
	this.polyphony = 1;
	this.activeKeys = [];
	this.voices = [];
	this.pitchBend = 0;

	function voice(key, velocity){
		this.key = key;
		this.velocity = velocity;
		this.noteOff = function(){};
		this.onKeyChange = function(){};
		this.changeKey = function(k, v){
			this.key = k;
			this.v = v;
			this.onKeyChange();
		};
		this.getFrequency = function(){
			return self.getFrequencyForKey(this.key);
		};
		self.voice.apply(this);
	}

	function removePressedKey(key){
		var i;
		for (i=0; i<pressedKeys.length; i++){
			if (pressedKeys[i].key === key){
				pressedKeys.splice(i--, 1);
			}
		}
	}

	function addPressedKey(key, velocity){
		removePressedKey(key);
		pressedKeys.push({key: key, velocity: velocity});
	}

	function selectActiveKeys(){
		var i, n, selected = [];

		if (self.legato === 0){
			selected = pressedKeys.slice(0);
		} else if (self.legato === 1) {
			for (i=0; i<pressedKeys.length; i++){
				for (n=0; n<selected.length; n++){
					if (n === pressedKeys.length - 1 || (selected[n-1].key > pressedKeys[i].key && selected[n].key < pressedKeys[i].key)){
						selected.splice(n, 0, pressedKeys[i]);
						break;
					}
				}
			}
		} else if (self.legato === 2) {
			for (i=0; i<pressedKeys.length; i++) {
				for (n=0; n<selected.length; n++) {
					if (n === pressedKeys.length - 1 || (selected[n-1].key < pressedKeys[i].key && selected[n].key > pressedKeys[i].key)){
						selected.splice(n, 0, pressedKeys[i]);
						break;
					}
				}
			}
		}

		self.activeKeys = selected.slice(-self.polyphony);
	}

	function selectVoices(){
		if (!self.voice){
			return;
		}
		var i, n, isActive;
		if (self.polyphony === 1 && self.activeKeys.length > 0){
			i = self.activeKeys.length - 1;
			if (self.voices.length === 0){
				self.voices.push(new voice(self.activeKeys[i].key, self.activeKeys[i].velocity));
			} else {
				self.voices[0].changeKey(self.activeKeys[i].key, self.activeKeys[i].velocity);
			}
		} else {
			for (n=0; n<self.activeKeys.length; n++){
				isActive = false;
				for (i=0; i<self.voices.length; i++){
					if (self.voices[i].key === self.activeKeys[n].key){
						isActive = true;
						break;
					}
				}
				if (!isActive){
					self.voices.push(new voice(self.activeKeys[i].key, self.activeKeys[i].velocity));
				}
			}
		}

		for (i=0; i<self.voices.length; i++){
			isActive = false;
			for (n=0; n<self.activeKeys.length; n++){
				if (self.voices[i].key === self.activeKeys[n].key){
					isActive = true;
					break;
				}
			}
			if (!isActive){
				self.voices[i].noteOff();
				self.voices.splice(i--, 1);
			}
		}
				
			
	}

	function noteOn(key, velocity){
		var previouslyPressed = self.activeKeys.length;
		addPressedKey(key, velocity);
		selectActiveKeys();
		selectVoices();
		self.onNoteOn(key, velocity);
		if (self.retrigger === 0 || (previouslyPressed === 0 && self.activeKeys.length > 0)){
			self.onTrigger();
		}
/*		document.title = (previouslyPressed == 0 && self.activeKeys.length > 0);
		if (self.retrigger == 0 || (previouslyPressed == 0 && self.activeKeys.length > 0))
			self.onTrigger();*/
	}

	function noteOff(key, velocity){
		removePressedKey(key, velocity);
		selectActiveKeys();
		selectVoices();
		self.onNoteOff(key, velocity);
		if (self.activeKeys === 0){
			self.onRelease();
		}
	}

	this.onMidi = function(midievent){
		switch(midievent.status){
			case 9: // NOTE ON (0x1001)
				noteOn(midievent.data1, midievent.data2/127);
				break;

			case 8: // NOTE OFF (0x1000)
				noteOff(midievent.data1, midievent.data2/127);
				break;
			case 14: // PITCH BEND (0x1110)
				self.pitchBend = (midievent.data1 * 128 + midievent.data2 - 8192) / 8192;
				break;
		}
	};

	this.getFrequencyForKey = function(key){
		return 440 * Math.pow(1.059, key-69);
	};

	this.getFrequency = function(){
		var frequencies = [], i;
		for (i=0; i<self.activeKeys.length; i++){
			frequencies.push(self.getFrequencyForKey(self.activeKeys[i].key));
		}
		if (frequencies.length > 2){
			return frequencies[0];
		}
		return frequencies;
	};

	this.onTrigger = function(){};
	this.onRelease = function(){};
	this.onNoteOn = function(){};
	this.onNoteOff = function(){};
	this.voice = null;

	this.listener = function(midievent)
	{
		self.onMidi(midievent);
	};
}
/**
 * Creates a StepSequencer.
 *
 * @constructor
 * @this {StepSequencer}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} stepLength (Optional) Step Length (ms).
 * @param {Array} steps (Optional) Array of steps (unsigned double) for the sequencer to iterate.
 * @param {number} attack (Optional) Attack (ms).
*/
function StepSequencer(sampleRate, stepLength, steps, attack){
	var	self	= this,
		phase	= 0;

	self.sampleRate		= sampleRate;
	self.stepLength		= stepLength || 200; // ms
	self.steps		= steps || [1,0];
	self.value		= 0;
	self.attack		= attack || 0;


	self.generate = function(){
		var	stepLength	= self.sampleRate / 1000 * self.stepLength,
			steps		= self.steps,
			sequenceLength	= stepLength * steps.length,
			step, overStep, prevStep, stepDiff,
			val;
		if (++phase === sequenceLength){
			phase = 0;
		}
		step		= phase / sequenceLength * steps.length;
		overStep	= step % 1;
		step		= Math.floor(step);
		prevStep	= (step || steps.length) - 1;
		stepDiff	= steps[step] - steps[prevStep];
		val = steps[step];
		if (overStep < self.attack){
			val -= stepDiff - stepDiff / self.attack * overStep;
		}
		self.value = val;
		return val;
	}

	self.triggerGate = function(){
		phase = 0;
	}
}
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
// Depends on oscillator.

/**
 * Creates a Chorus effect.
 *
 * @constructor
 * @this {Chorus}
 * @param {number} sampleRate Sample Rate (hz).
 * @param {number} delayTime (Optional) Delay time (ms).
 * @param {number} depth (Optional) Depth.
 * @param {number} freq (Optional) Frequency (hz) of the LFO.
*/
function Chorus(sampleRate, delayTime, depth, freq){
	var	self		= this,
		buffer, bufferPos, sample;

	self.delayTime	= delayTime || 30;
	self.depth	= depth	|| 3;
	self.freq	= freq || 0.1;

	function calcCoeff(){
		buffer = new Float32Array(self.sampleRate * 0.1);
		bufferPos = 0;
		var i, l = buffer.length;
		for (i=0; i<l; i++){
			buffer[i] = 0.0;
		}
	}

	self.sampleRate = sampleRate;
	self.osc = new Oscillator(sampleRate, freq);
	self.calcCoeff = calcCoeff;
	self.pushSample = function(s){
		if (++bufferPos >= buffer.length){
			bufferPos = 0;
		}
		buffer[bufferPos] = s;
		self.osc.generate();

		var delay = self.delayTime + self.osc.getMix() * self.depth;
		delay *= self.sampleRate / 1000;
		delay = bufferPos - Math.floor(delay);
		while(delay < 0){
			delay += buffer.length;
		}

		sample = buffer[delay];
		return sample;
	};
	self.getMix = function(){
		return sample;
	};

	calcCoeff();
}
/**
 * Creates a Delay effect.
 *
 * @constructor
 * @this {Delay}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} time (Optional) Delay time (ms).
 * @param {number} feedback (Optional) Feedback (unsigned double).
*/
function Delay(samplerate, time, feedback)
{
	var	self		= this,
		bufferSize	= (!samplerate ? 44100 : samplerate) * 2,
		buffer		= new Float32Array(bufferSize),
		bufferPos	= 0,
		speed		= 0,
		prevTime	= 0,
		sample		= 0.0,

		floor		= Math.floor;

	function calcCoeff(){
		speed = bufferSize / self.samplerate / self.time * 1000;
		prevTime = self.time;
	}

	function fillBuffer(sample, from, to){
		var i = from;
		while (i++ !== to){
			if (i >= bufferSize){
				i=0;
			}
			buffer[i] = sample;
		}
	}

	function algo0(s){
		buffer[bufferPos++] += s;
		if (bufferPos > self.time / 1000 * self.samplerate){
			bufferPos = 0;
		}
		buffer[bufferPos] = buffer[bufferPos] * self.feedback;
	}

	function algo1(s){
		var startPos = floor(bufferPos);
		if (prevTime !== self.time){
			calcCoeff();
		}
		bufferPos += speed;
		if (bufferPos >= bufferSize){
			bufferPos -= bufferSize;
		}
		fillBuffer(s + buffer[floor(bufferPos)] * self.feedback, startPos, floor(bufferPos));
	}

	this.time = !time ? 1000 : time; //ms
	this.feedback = 0.0; // 0.0 - 1.0
	this.algorithm = 0; // ['No resampling(faster)', 'Resampling (slower, beta)']
	this.samplerate = samplerate;

	this.pushSample = function(s){
		if (this.algorithm === 0){
			algo0(s);
		} else {
			algo1(s);
		}
		sample = buffer[floor(bufferPos)];
		return sample;
	};

	this.getMix = function(){
		return sample;
	};
}
// Requires IIRFilter

/**
 * Creates a Distortion effect.
 *
 * @constructor
 * @this {Distortion}
 * @param {number} sampleRate Sample Rate (hz).
*/
function Distortion(sampleRate) // Based on the famous TubeScreamer.
{
	var	hpf1	= new IIRFilter(sampleRate, 720.484),
		lpf1	= new IIRFilter(sampleRate, 723.431),
		hpf2	= new IIRFilter(sampleRate, 1.0),
		smpl	= 0.0;
	this.gain = 4;
	this.master = 1;
	this.sampleRate = sampleRate;
	this.filters = [hpf1, lpf1, hpf2];
	this.pushSample = function(s){
		hpf1.pushSample(s);
		smpl = hpf1.getMix(1) * this.gain;
		smpl = Math.atan(smpl) + smpl;
		if (smpl > 0.4){
			smpl = 0.4;
		} else if (smpl < -0.4) {
			smpl = -0.4;
		}
		lpf1.pushSample(smpl);
		hpf2.pushSample(lpf1.getMix(0));
		smpl = hpf2.getMix(1) * this.master;
		return smpl;
	};
	this.getMix = function(){
		return smpl;
	};
}
(function(global, audioLib){

audioLib.Capper = function(sampleRate, cap){
	var	self	= this,
		sample	= 0.0;
	self.sampleRate = sampleRate;
	self.cap = cap || 1;
	self.pushSample = function(s){
		sample = s > self.cap ? 2 * self.cap - s : s < -self.cap ? -2 * self.cap - s : s;
		return sample;
	};
	self.getMix = function(){
		return sample;
	};
};

audioLib.Expo = function(sampleRate, param){
	var	self	= this;
		sample	= 0.0;
	self.sampleRate = sampleRate;
	self.param = param || 0.8;
	self.pushSample = function(s){
		sample = (s < 0 ? -Math.pow(self.param * 2, -s) : Math.pow(self.param * 2, s) ) / 10;
		return sample;
	};
	self.getMix = function(){
		return sample;
	};
}

}(this, audioLib));
// Adapted from Corban Brook's dsp.js

/**
 * Creates a IIRFilter effect.
 *
 * @constructor
 * @this {IIRFilter}
 * @param {number} samplerate Sample Rate (hz).
 * @param {number} cutoff (Optional) The cutoff frequency (hz).
 * @param {number} resonance (Optional) Resonance (unsigned double).
 * @param {number} type (Optional) The type of the filter [uint2] (LowPass, HighPass, BandPass, Notch).
*/
function IIRFilter(samplerate, cutoff, resonance, type){
	var	self	= this,
		f	= [0.0, 0.0, 0.0, 0.0],
		freq, damp,
		prevCut, prevReso,

		sin	= Math.sin,
		min	= Math.min,
		pow	= Math.pow;

	self.cutoff = !cutoff ? 20000 : cutoff; // > 40
	self.resonance = !resonance ? 0.1 : resonance; // 0.0 - 1.0
	self.samplerate = samplerate;
	self.type = type || 0;

	function calcCoeff(){
		freq = 2 * sin(Math.PI * min(0.25, self.cutoff / (self.samplerate * 2)));
		damp = min(2 * (1 - pow(self.resonance, 0.25)), min(2, 2 / freq - freq * 0.5));
	}

	self.pushSample = function(sample){
		if (prevCut !== self.cutoff || prevReso !== self.resonance){
			calcCoeff();
			prevCut = self.cutoff;
			prevReso = self.resonance;
		}

		f[3] = sample - damp * f[2];
		f[0] = f[0] + freq * f[2];
		f[1] = f[3] - f[0];
		f[2] = freq * f[1] + f[2];

		f[3] = sample - damp * f[2];
		f[0] = f[0] + freq * f[2];
		f[1] = f[3] - f[0];
		f[2] = freq * f[1] + f[2];

		return f[self.type];
	};

	self.getMix = function(type){
		return f[type || self.type];
	};
}
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
function Sampler(sampleRate, sample, pitch){
	var	self	= this,
		voices	= [],
		smpl;
	self.sampleRate	= sampleRate;
	self.sample	= sample;
	self.pitch	= pitch || 440;
	self.delayStart	= 0;
	self.delayEnd	= 0;
	self.maxVoices	= 0;
	self.noteOn	= function(frequency){
		frequency	= frequency || self.pitch;
		var	speed	= frequency / self.pitch,
			rate	= self.sampleRate,
			start	= rate * self.delayStart,
			end	= self.sample.length - rate * self.delayEnd,
			note	= {
			f:	frequency,
			p:	start,
			s:	speed,
			l:	end
		};
		voices.push(note);
		return note;
	};
	self.generate	= function(){
		var	i, voice;
		for (i=0; i<voices.length; i++){
			voice = voices[i];
			voice.p += voice.s;
			voice.p > voice.l && voices.splice(i--, 1) && voice.onend && voice.onend();
		}
	};
	self.getMix	= function(){
		var	smpl	= 0,
			i;
		for (i=0; i<voices.length; i++){
			smpl	+= Sampler.interpolate(self.sample, voices[i].p);
		}
		return smpl;
	};
	sampler.loadWav	= function(data, resample){
		var	pcm	= audioLib.PCMData.decode(data);
		self.sample	= resample ? Sampler.resample(pcm.data, pcm.sampleRate, 1, self.sampleRate, 1) : pcm.data;
	};
}

/**
 * Interpolates a fractal part position in an array to a sample.
 *
 * @param {Array} arr The sample buffer.
 * @param {number} pos The position to interpolate from.
 * @return {Float32} The interpolated sample.
*/
Sampler.interpolate	= function(arr, pos){
	var	first	= Math.floor(pos),
		second	= first + 1,
		frac	= pos - first;
	 second		= second < arr.length ? second : 0;
	return arr[first] * (1 - frac) + arr[second] * frac;
};

/**
 * Resamples a sample buffer from a frequency to a frequency and / or from a sample rate to a sample rate.
 *
 * @param {Float32Array} buffer The sample buffer to resample.
 * @param {number} fromRate The original sample rate of the buffer.
 * @param {number} fromFrequency The original frequency of the buffer.
 * @param {number} toRate The sample rate of the created buffer.
 * @param {number} toFrequency The frequency of the created buffer.
*/
Sampler.resample	= function(buffer, fromRate, fromFrequency, toRate, toFrequency){
	var
		speed		= toRate / fromRate * toFrequency / fromFrequency,
		l		= buffer.length,
		length		= Math.ceil(l / speed),
		newBuffer	= new Float32Array(length),
		i, n;
	for (i=0, n=0; i<l; i += speed){
		newBuffer[n++] = Sampler.interpolate(buffer, i);
	}
	return newBuffer;
};
(function (global){
/**
 * Enumerates contents of an array as properties of an object, defined as true.
 *
 * @param {Array} arr The array to be enumerated.
 * @return {Object} The resulting object.
*/
	function propertyEnum(arr){
		var	i, l	= arr.length,
			result	= {};
		for (i=0; i<l; i++){
			result[arr[i]] = true;
		}
		return result;
	}

	var	allowedBufferSizes	= propertyEnum([256, 512, 1024, 2048, 4096, 8192, 16384]),
		allowedSampleRates	= propertyEnum([48000, 44100, 22050]),

		intToStr		= String.fromCharCode;

/**
 * Creates an AudioDevice according to specified parameters, if possible.
 *
 * @param {Function} readFn A callback to handle the buffer fills.
 * @param {number} channelCount Channel count.
 * @param {number} preBufferSize (Optional) Specifies a pre-buffer size to control the amount of latency.
 * @param {number} sampleRate Sample rate (ms).
*/
	function AudioDevice(readFn, channelCount, preBufferSize, sampleRate){
		var	devices	= AudioDevice.devices,
			dev;
		for (dev in devices){
			if (devices.hasOwnProperty(dev) && devices[dev].enabled){
				try{
					return new devices[dev](readFn, channelCount, preBufferSize, sampleRate);
				} catch(e1){};
			}
		}

		throw "No audio device available.";
	}

	function Recording(bindTo){
		this.boundTo = bindTo;
		this.buffers = [];
		bindTo.activeRecordings.push(this);
	}

	Recording.prototype = {
		toWav: function(bytesPerSample){
			return audioLib.PCMData.encode({
				data:		this.join(),
				sampleRate:	this.boundTo.sampleRate,
				channelCount:	this.boundTo.channelCount,
				bytesPerSample:	bytesPerSample
			});
		}, add: function(buffer){
			this.buffers.push(buffer);
		}, clear: function(){
			this.buffers = [];
		}, stop: function(){
			var	recordings = this.boundTo.activeRecordings,
				i;
			for (i=0; i<recordings.length; i++){
				if (recordings[i] === this){
					recordings.splice(i--, 1);
				}
			}
		}, join: function(){
			var	bufferLength	= 0,
				bufPos		= 0,
				buffers		= this.buffers,
				newArray,
				n, i, l		= buffers.length;

			for (i=0; i<l; i++){
				bufferLength += buffers[i].length;
			}
			newArray = new Float32Array(bufferLength);
			for (i=0; i<l; i++){
				for (n=0; n<buffers[i].length; n++){
					newArray[bufPos + n] = buffers[i][n];
				}
				bufPos += buffers[i].length;
			}
			return newArray;
		}
	};

	function audioDeviceClass(type){
		this.type = type;
	}


	audioDeviceClass.prototype = {
		record: function(){
			return new Recording(this);
		}, recordData: function(buffer){
			var	activeRecs	= this.activeRecordings,
				i, l		= activeRecs.length;
			for (i=0; i<l; i++){
				activeRecs[i].add(buffer);
			}
		}, writeBuffers: function(buffer){
			var	
				buffers		= this.buffers,
				l		= buffer.length,
				buf,
				bufLength,
				i, n;
			if (buffers){
				for (i=0; i<buffers.length; i++){
					buf		= buffers[i];
					bufLength	= buf.length;
					for (n=0; n < l && n < bufLength; n++){
						buffer[n] += buf[n];
					}
					buffers[i] = buf.subarray(n);
					i >= bufLength && buffers.splice(i--, 1);
				}
			}
		}, writeBuffer: function(buffer){
			var	buffers		= this.buffers = this.buffers || [];
			buffers.push(buffer);
			return buffers.length;
		}
	};

	function mozAudioDevice(readFn, channelCount, preBufferSize, sampleRate){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? preBufferSize : sampleRate / 2;
		var	self			= this,
			currentWritePosition	= 0,
			tail			= null,
			audioDevice		= new Audio(),
			timer; // Fix for https://bugzilla.mozilla.org/show_bug.cgi?id=630117

		function bufferFill(){
			var written, currentPosition, available, soundData;
			if (tail){
				written = audioDevice.mozWriteAudio(tail);
				currentWritePosition += written;
				if (written < tail.length){
					tail = tail.subarray(written);
					return tail;
				}
				tail = null;
			}

			currentPosition = audioDevice.mozCurrentSampleOffset();
			available = Number( currentPosition + preBufferSize * channelCount - currentWritePosition) + 0;
			if (available > 0){
				soundData = new Float32Array(available);
				readFn && readFn(soundData, self.channelCount);
				self.writeBuffers(soundData);
				self.recordData(soundData);
				written = audioDevice.mozWriteAudio(soundData);
				if (written < soundData.length){
					tail = soundData.subarray(written);
				}
				currentWritePosition += written;
			}
		}

		audioDevice.mozSetup(channelCount, sampleRate);
		timer = setInterval(bufferFill, 20);

		this.kill = function(){
			clearInterval(timer);
		};
		this.activeRecordings = [];

		this.sampleRate		= sampleRate;
		this.channelCount	= channelCount;
		this.type		= 'moz';
	}

	mozAudioDevice.enabled	= true;
	mozAudioDevice.prototype = new audioDeviceClass('moz');

	function webkitAudioDevice(readFn, channelCount, preBufferSize, sampleRate){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? preBufferSize : 4096;
		var	self		= this,
			context		= new (window.AudioContext || webkitAudioContext)(),
			node		= context.createJavaScriptNode(preBufferSize, 0, channelCount),
			// For now, we have to accept that the AudioContext is at 48000Hz, or whatever it decides, and that we have to use a dummy buffer source.
			inputBuffer	= context.createBufferSource(/* sampleRate */);

		function bufferFill(e){
			var	outputBuffer	= e.outputBuffer,
				channelCount	= outputBuffer.numberOfChannels,
				i, n, l		= outputBuffer.length,
				size		= outputBuffer.size,
				channels	= new Array(channelCount),
				soundData	= new Float32Array(l * channelCount);

			for (i=0; i<channelCount; i++){
				channels[i] = outputBuffer.getChannelData(i);
			}

			readFn && readFn(soundData, channelCount);
			self.writeBuffers(soundData);
			self.recordData(soundData);

			for (i=0; i<l; i++){
				for (n=0; n < channelCount; n++){
					channels[n][i] = soundData[i * channelCount + n];
				}
			}
		}

		node.onaudioprocess = bufferFill;
		// Connect the dummy buffer to the JS node to get a push.
		inputBuffer.connect(node);
		node.connect(context.destination);

		this.kill = function(){
			// ??? I have no idea how to do this.
		};
		this.activeRecordings = [];

		this.sampleRate		= context.sampleRate;
		this.channelCount	= channelCount;
		this.type		= 'webkit';
	}

	webkitAudioDevice.enabled	= true;
	webkitAudioDevice.prototype	= new audioDeviceClass('webkit');

	function dummyAudioDevice(readFn, channelCount, preBufferSize, sampleRate){
		sampleRate	= allowedSampleRates[sampleRate] ? sampleRate : 44100;
		preBufferSize	= allowedBufferSizes[preBufferSize] ? bufferSize : 8192;
		var 	self		= this,
			timer;

		function bufferFill(){
			var	soundData = new Float32Array(preBufferSize * channelCount);
			readFn && readFn(soundData, self.channelCount);
			self.writeBuffers(soundData);
			self.recordData(soundData);
		}

		this.kill = function(){
			clearInterval(timer);
		}
		this.activeRecordings = [];

		setInterval(bufferFill, preBufferSize / sampleRate * 1000);

		this.sampleRate		= sampleRate;
		this.channelCount	= channelCount;
		this.type		= 'dummy';
	}

	dummyAudioDevice.enabled	= true;
	dummyAudioDevice.prototype	= new audioDeviceClass('dummy');

	AudioDevice.deviceClass		= audioDeviceClass;
	AudioDevice.propertyEnum	= propertyEnum;
	AudioDevice.devices		= {
		moz:		mozAudioDevice,
		webkit:		webkitAudioDevice,
		dummy:		dummyAudioDevice
	};

	global.AudioDevice = AudioDevice;
}(this));
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
/*
pcmdata.js
Uses binary.js and stream.js to parse PCM wave data.
On GitHub:
 * pcmdata.js	http://goo.gl/4uu06
 * binary.js	http://goo.gl/ZaWqK

binary.js repository also includes stream.js

MIT License
*/


(function(b,c){var j=String.fromCharCode,h=true,d=false;function g(k,l){return l?j(k&255)+g(k>>8,l-1):""}function e(k,l){return l?e(k>>8,l-1)+j(255-k&255):""}function i(k,l,m){return m?e(k,l):g(k,l)}function a(r,q){var k=r.length,p=k-1,s=0,o=c.pow,m;if(q){for(m=0;m<k;m++){s+=(255-r.charCodeAt(m))*o(256,p-m)}}else{for(m=0;m<k;m++){s+=r.charCodeAt(m)*o(256,m)}}return s}function f(p,t,o,x){var s=c.pow,r=c.floor,m=f.convertFromBinary,u=f.convertToBinary,k=p/8,q=s(2,p),w=q/2,l=w-0.5,y=w-1,v=1/l,n=1/y;return x?o?t?function(z,A){z=r(z*y);return u(z<0?w-z:z,k,A)}:function(z,A){return u(r(z*y),k,A)}:t?function(z,A){return u(z<0?y-z:z,k,A)}:function(z,A){return u(z,k,A)}:o?t?function(B,A){var z=m(B,A);return z>l?(l-z)*v:z*n}:function(A,z){return m(A,z)*n}:t?function(B,A){var z=m(B,A);return z>y?y-z:z}:function(A,z){return m(A,z)}}f.convertToBinary=i;f.convertFromBinary=a;f.fromFloat32=f(32,h,h,h);f.toFloat32=f(32,h,h,d);f.fromInt32=f(32,h,d,h);f.toInt32=f(32,h,d,d);f.fromInt24=f(24,h,d,h);f.toInt24=f(24,h,d,d);f.fromInt16=f(16,h,d,h);f.toInt16=f(16,h,d,d);f.fromInt8=f(8,h,d,h);f.toInt8=f(8,h,d,d);f.fromUint32=f(32,d,d,h);f.toUint32=f(32,d,d,d);f.fromUint16=f(16,d,d,h);f.toUint16=f(16,d,d,d);f.fromUint8=f(8,d,d,h);f.toUint8=f(8,d,d,d);b.Binary=f}(this,Math));(function(e,f){function g(h){this.data=h}var d=g.prototype={read:function(i){var h=this,j=h.data.substr(0,i);h.data=h.data.substr(i);h.pointer+=i;return j}},c,b;function a(k,i,j){var h=i/8;d["read"+k+i]=function(){return j(this.read(h))}}for(c in f){b=/to([a-z]+)([0-9]+)/i.exec(c);b&&a(b[1],b[2],f[c])}e.Stream=g;g.newType=a}(this,this.Binary));this.PCMData=(function(a,b){function c(d){return(typeof d==="string"?c.decode:c.encode)(d)}c.decode=function(D){var g=new b(D),o=g.read(4),v=g.readUint32();g=new b(g.read(v));var k=g.read(4),n=g.read(4),t=g.readUint32(),d=new b(g.read(t)),f=d.readUint16(),y=d.readUint16(),B=d.readUint32(),h=d.readUint32(),A=d.readUint16(),z=A/y,m=t===16?d.readUint16():d.readUint32(),l="readInt"+(z*8),q=1/Math.pow(2,z*8-1),e,p,r,w,C,u,j,x,s={};while(g.data){e=g.read(4);p=g.readUint32();w=g.read(p);j=s[e]=s[e]||[];if(e==="data"){r=~~(p/z);C=new b(w);u=(typeof Float32Array!=="undefined"?Float32Array:Array)(r);for(x=0;x<r;x++){u[x]=C[l]()*q}}else{j.push(w)}}return{channelCount:y,bytesPerSample:A/y,sampleRate:h/A,chunks:s,data:u}};c.encode=function(x){var s=a.fromUint32,y=a.fromUint16,p=x.data,e=x.sampleRate,j=x.channelCount||1,u=x.bytesPerSample||1,k=u*8,g=j*u,v=e*g,h=p.length,f=h*u,o=Math.pow(2,k-1)-1,d=a["fromInt"+k],m=[],l="",w,t,q,r;m.push("fmt "+s(16)+y(1)+y(j)+s(e)+s(v)+y(g)+y(k));for(t=0;t<h;t++){l+=d(p[t]*o)}m.push("data"+s(f)+l);r=x.chunks;if(r){for(t in r){if(r.hasOwnProperty(t)){w=r[t];for(q=0;q<w.length;q++){l=w[q];m.push(t+s(l.length)+l)}}}}m=m.join("");return"RIFF"+s(m.length)+"WAVE"+m};return c}(this.Binary,this.Stream));
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
/*
	wrapper-end.js
	Please note that this file is of invalid syntax if standalone.
*/

// Controls
audioLib.ADSREnvelope		= ADSREnvelope;
audioLib.MidiEventTracker	= MidiEventTracker;
audioLib.StepSequencer		= StepSequencer;

//Effects
audioLib.AllPassFilter	= AllPassFilter;
audioLib.Chorus		= Chorus;
audioLib.Delay		= Delay;
audioLib.Distortion	= Distortion;
audioLib.IIRFilter	= IIRFilter;
audioLib.LowPassFilter	= LowPassFilter;
audioLib.LP12Filter	= LP12Filter;


//Geneneration
audioLib.Oscillator	= Oscillator;
audioLib.Sampler	= Sampler;

function EffectChain(){
	var	arr	= Array.prototype.splice.call(arguments, 0),
		proto	= arr.prototype = EffectChain.prototype;
	for (i in proto){
		if (proto.hasOwnProperty(i)){
			arr[i] = proto[i];
		}
	}
	return arr;
}

(function(proto){
	EffectChain.prototype = proto;
	proto.pushSample = function(sample){
		var	self	= this,
			mix,
			i;
		for (i=0; i<self.length; i++){
			mix	= self[i].mix;
			sample	= self[i].pushSample(sample) * mix + sample * (1 - mix);
		}
		return sample;
	};
}({}));

function EffectClass(){
}

EffectClass.prototype = {
	type:	'effect',
	sink:	true,
	source:	true,
	mix:	0.5,
	join:	function(){
		return EffectChain.apply(0, [this].concat(Array.prototype.splice.call(arguments, 0)));
	}
};

(function(names, i, effects, name, proto){
	effects = audioLib.effects = {};
	for (i=0; i<names.length; i++){
		name = names[i];
		effects[name]	= audioLib[name];
		proto		= effects[name].prototype = new EffectClass();
		proto.name	= proto.fxid = name;
	}
}(['AllPassFilter', 'Chorus', 'Delay', 'Distortion', 'IIRFilter', 'LowPassFilter', 'LP12Filter']));

audioLib.EffectChain	= EffectChain;
audioLib.EffectClass	= EffectClass;

audioLib.version	= '0.4.4';

return audioLib;
}).call(typeof exports === 'undefined' ? {} : this, this.window || global, Math);
