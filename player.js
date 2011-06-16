
Mad.Player = function (stream) {
    this.stream = stream;
    this.mp3 = new Mad.MP3File(stream);
    this.id3  = this.mp3.getID3v2Stream();
    this.mpeg = this.mp3.getMpegStream();

    // default onProgress handler
    this.onProgress = function (playtime, total) {
        console.log("playtime = " + playtime + " / " + total);
    }
};

// Create a device.
Mad.Player.prototype.createDevice = function() {
	var synth = new Mad.Synth();
	this.frame = new Mad.Frame();
	this.frame = Mad.Frame.decode(this.frame, this.mpeg);
	if (this.frame == null) {
		if (mpeg.error == Mad.Error.BUFLEN) {
			console.log("End of file!");
		}

		console.log("First error! code = " + this.mpeg.error + ", recoverable ? = " + Mad.recoverable(this.mpeg.error));
		return;
	}

	this.channelCount = this.frame.header.nchannels();
	this.sampleRate = this.frame.header.samplerate;

	console.log("this.playing " + this.channelCount + " channels, samplerate = " + this.sampleRate + " audio, mode " + this.frame.header.mode);

	this.offset = 0;
	this.frameIndex = 0;
	this.frameSamples = [];
	
	synth.frame(this.frame);
	this.frameSamples.push(synth.pcm.samples);
	
	this.lastRebuffer = Date.now();
	this.playing = false;
	this.progress();
	
	var preBufferSize = 65536 * 1024;
	var self = this;
	
	var MAX_FRAMES_IN_BUFFER = 40;
	
	this.dev = audioLib.AudioDevice(function (sampleBuffer) {
		//console.log("delta = " + (Date.now() - self.lastRebuffer) + ", asked for " + sampleBuffer.length);
		self.lastRebuffer = Date.now();
		
		if(!self.playing) return; // empty sampleBuffer, no prob
		
		var index = 0;

		while (index < sampleBuffer.length) {
			for (var i = 0; i < self.channelCount; ++i) {
				sampleBuffer[index++] = self.frameSamples[self.frameIndex][i][self.offset];
			}

			self.offset++;
			
			if (self.offset >= self.frameSamples[self.frameIndex][0].length) {
				self.offset = 0;

				self.frame = Mad.Frame.decode(self.frame, self.mpeg);
				if (self.frame == null) {
					if (self.stream.error == Mad.Error.BUFLEN) {
						console.log("End of file!");
					}
					console.log("Error! code = " + self.mpeg.error);
					self.playing = false;
					self.onProgress(1, 1);
					self.dev.kill();
				} else {
					synth.frame(self.frame);
					self.frameSamples.push(synth.pcm.samples);
					self.frameIndex++;
					
					if(self.frameSamples.length > MAX_FRAMES_IN_BUFFER) {
						var oldlength = self.frameSamples.length;
						self.frameSamples = self.frameSamples.slice(0, 2);
						self.frameIndex -= (oldlength - self.frameSamples.length);
					}
				}
			}
		}

	}, this.channelCount, preBufferSize, this.sampleRate);
};

Mad.Player.prototype.setPlaying = function(playing) {
	this.playing = playing;
	if(playing) {
		this.onPlay();
	} else {
		this.onPause();
	}
}

Mad.Player.prototype.destroy = function() {
	clearTimeout(this.progressTimeout);
	if(this.dev) {
		this.dev.kill();
	}
}

Mad.Player.prototype.progress = function () {
    var playtime = ((this.frameIndex * 1152 + this.offset) / this.sampleRate) + (Date.now() - this.lastRebuffer) / 1000.0;
    //console.log("contentLength = " + this.stream.state.contentLength + ", this.offset = " + this.mpeg.this_frame);
    var total = playtime * this.stream.state.contentLength / this.mpeg.this_frame;

    if (this.playing) {
        this.onProgress(playtime, total);
    }
    
    var that = this;
    var nextCall = function() { that.progress(); };
    this.progressTimeout = setTimeout(nextCall, 500);
}

Mad.Player.fromFile = function (file, callback) {
    new Mad.FileStream(file, function (stream) {
        callback(new Mad.Player(stream));
    });
};

Mad.Player.fromURL = function (url, callback) {
    var stream = new Mad.AjaxStream(url);
    stream.requestAbsolute(128 * 1024, function () {
        callback(new Mad.Player(stream));
    });
};
