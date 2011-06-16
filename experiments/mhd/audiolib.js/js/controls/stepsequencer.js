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
