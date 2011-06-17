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
