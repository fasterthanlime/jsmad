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
