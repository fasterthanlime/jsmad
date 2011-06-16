audiolib.js
===========

audiolib.js is a powerful audio tools library for javascript.

Amongst other things, it provides AudioDevice class which has a consistent callback API that supports both Firefox4's Audio Data API and Chrome 10's Web Audio API.

As of v.0.4.0, audioLib supports scheduling, which means you can synchronize events with the audio stream (e.g. turning a slider would be scheduled to the right time in the buffer versus being changed only on buffer fill event).
However, using the scheduled interface is a design choice you will have to weigh carefully, as it might introduce a performance hit, and it affects how your data is being handled. For instance, in the scheduled interface you will most likely not get a buffer of the specified preBufferSize, but instead, you get a buffer that contains a single sample for each channel, and you have to be careful with this, performance-wise.

Usage
-----

```javascript
// Create a device.
var dev = audioLib.AudioDevice(function(sampleBuffer){
	// Fill the buffer here.
}, channelCount, preBufferSize, sampleRate);

// Note that all the arguments are optional, so if you want to create a write-only device, you can leave the arguments blank.
// Writing buffers:
dev.writeBuffer(buffer);

// Or create a scheduled AudioDevice
var dev = audioLib.AudioDevice.createScheduled(/* same arguments as for the normal AudioDevice call */);

// Schedule an event
dev.schedule(function(){
	// do something, change oscillator frequency, whatever, see ./tests/scheduling.html for an example.
});

// Effects

var del = new audioLib.Delay(sampleRate, delay, feedback);

var flt = new audioLib.IIRFilter(sampleRate, cutoffFreq, resonance);

var flt = new audioLib.LP12Filter(sampleRate, cutoffFreq, resonance);

var flt = new audioLib.LowPassFilter(sampleRate, cutoffFreq, resonance);

var dist = new audioLib.Distortion(sampleRate);

// to feed a new input sample
effect.pushSample(sample);
// to get the output
sample = effect.getMix();

// Synthesis

var osc = new audioLib.Oscillator(sampleRate, frequency);

// to generate a new sample
osc.generate(fm1, fm2, ..., fmX);
// to get the output
osc.getMix();

// Sampler

var sampler = new audioLib.Sampler(sampleRate, sampleBuffer, defaultPitch);

// Envelopes

var adsr = new audioLib.ADSREnvelope(sampleRate, attack, decay, sustain, release);

// to trigger the gate
adsr.triggerGate(isOpen);
// to update the value ** Do this on every sample fetch for this to work properly. also returns the current value
adsr.generate();
// Get the value
adsr.value; // 0.0 - 1.0, unless you put something more as sustain

var stepSeq = new audioLib.StepSequencer(sampleRate, stepLength, stepArray, attack);

// To start the sequence over
stepSeq.triggerGate();
// to update the value ** Do this on every sample fetch for this to work properly. also returns the current value
stepSeq.generate();
// Get the value
stepSeq.value; // 0.0 - 1.0

//Recording

var rec = dev.record();

// To stop
rec.stop();
// To export wav
var audioElement = new Audio(
	'data:audio/wav;base64,' +
	btoa( rec.toWav() ) // presuming btoa is supported
);

// Resampling buffers
audioLib.Sampler.resample(buffer, fromSampleRate, fromFrequency, toSampleRate, toFrequency);

// Effect chains
var fx = new audioLib.EffectChain(fx1, fx2, fx3 /*, ...*/);
// Or...
var fx = fx1.join(fx2, fx3 /*, ...*/);

// Used just as if it were a single effect:
sample = fx.pushSample(sample);

// You can adjust mix or other properties of the chain simply as it were an array.
fx[0].mix = 0.75;

```

Node.JS
-------

To install the latest version on NodeJS, please use the NPMJS:

```shell

$ npm install audiolib

```

You can now use ``` require('audiolib') ``` to use the library just as you would on the clientside.

Demos
-----

(if you have your own, please fork & add | msg me)

* http://niiden.com/orbisyn/


Licensed under MIT license.
