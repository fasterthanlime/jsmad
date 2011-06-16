
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
	var frame = new Mad.Frame();
	frame = Mad.Frame.decode(frame, this.mpeg);
	if (frame == null) {
		if (mpeg.error == Mad.Error.BUFLEN) {
			console.log("End of file!");
		}

		console.log("First error! code = " + this.mpeg.error + ", recoverable ? = " + Mad.recoverable(this.mpeg.error));
		return;
	}

	this.channelCount = frame.header.nchannels();
	this.sampleRate = frame.header.samplerate;

	console.log("this.playing " + this.channelCount + " channels, samplerate = " + this.sampleRate + " audio, mode " + frame.header.mode);

	synth.frame(frame);
	this.offset = 0;
	this.frameIndex = 0;
	this.lastRebuffer = Date.now();
	this.playing = true;
	this.progress();
	
	var preBufferSize = 65536 * 1024;
	var self = this;
	
	var dev = audioLib.AudioDevice(function (sampleBuffer) {
		//console.log("being asked for " + sampleBuffer.length + " bytes");
		var index = 0;

		while (index < sampleBuffer.length) {
			for (var i = 0; i < self.channelCount; ++i) {
				sampleBuffer[index++] = synth.pcm.samples[i][self.offset];
			}

			self.offset++;
			self.lastRebuffer = Date.now();

			if (self.offset >= synth.pcm.samples[0].length) {
				self.offset = 0;

				self.frameIndex++;
				frame = Mad.Frame.decode(frame, self.mpeg);
				if (frame == null) {
					if (stream.error == Mad.Error.BUFLEN) {
						console.log("End of file!");
					}
					console.log("Error! code = " + self.mpeg.error);
					self.playing = false;
					self.onProgress(1, 1);
					dev.kill();
				} else {
					synth.frame(frame);
				}
			}
		}

	}, this.channelCount, preBufferSize, this.sampleRate);
};

Mad.Player.prototype.progress = function () {
    var playtime = ((this.frameIndex * 1152 + this.offset) / this.sampleRate) + (Date.now() - this.lastRebuffer) / 1000.0;
    console.log("contentLength = " + this.stream.state.contentLength + ", this.offset = " + this.mpeg.this_frame);
    var total = playtime * this.stream.state.contentLength / this.mpeg.this_frame;

    if (this.playing) {
        this.onProgress(playtime, total);
    }
    
    var that = this;
    var nextCall = function() { that.progress(); };
    setTimeout(nextCall, 500);
}

Mad.Player.fromFile = function (file, callback) {
    new Mad.FileStream(file, function (stream) {
        callback(new Mad.Player(stream));
    });
};

Mad.Player.fromURL = function (url, callback) {
    var stream = new Mad.AjaxStream(url);
    stream.requestAbsolute(128000, function () {
        callback(new Mad.Player(stream));
    });
};
