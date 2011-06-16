
function pad(length, sym, str) {
	while(str.length < length) str = sym + str;
	return str;
}

function onProgress(playtime, total) {
	console.log("playtime = " + playtime + " / " + total);
}

function readFile() {
    
    var track_id = document.getElementById('idChooser').value;
    
	var url = "http://sandbox.official.fm/jsmad-proxy/?id=" + track_id;
    
    console.log("url = " + url);
    if (!url) {
        return;
    }
    
    var playMusic = function (stream) {
      var mp3 = new Mad.MP3File(stream);
      
      var id3 = mp3.getID3v2Stream()
      
      if (id3) {
          id3 = id3.toHash();
          
          var id3element = document.getElementById('ID3');
          
          id3string =  "<p><strong>Title:</strong> " + id3['Title/Songname/Content description'] + "</p>";
          id3string += "<p><strong>Track:</strong> " + id3['Track number/Position in set'] + "</p>";
          id3string += "<p><strong>Artist:</strong> " + id3['Lead artist/Lead performer/Soloist/Performing group'] + "</p>";
          id3string += "<p><strong>Album:</strong> " + id3['Album/Movie/Show title'] + "</p>";
          id3string += "<p><strong>Year:</strong> " + id3['Year'] + "</p>";
          
          var pictures = id3['Attached picture'];
          
          if (pictures) {
              var mime = pictures[0].mime;
              var enc  = btoa(pictures[0].value);
              id3string += "<img alt='cover' src='data:" + mime + ';base64,' + enc + "'></img>";
          }
          
          id3element.innerHTML = id3string;
      }
      
      var mpeg = mp3.getMpegStream();
      
      var synth = new Mad.Synth();
      var frame = new Mad.Frame();
      
      frame = Mad.Frame.decode(frame, mpeg);
      
      if(frame == null) {
          if(mpeg.error == Mad.Error.BUFLEN) {
              console.log("End of file!");
          }
          
          console.log("First error! code = " + mpeg.error + ", recoverable ? = " + Mad.recoverable(mpeg.error));
          
          return;
      }
      
      var channelCount = frame.header.nchannels();
      var preBufferSize = 65536 * 1024;
      var sampleRate = frame.header.samplerate;

      console.log("playing " + channelCount + " channels, samplerate = " + sampleRate + " audio, mode " + frame.header.mode);

      synth.frame(frame);
      var offset = 0;
      var frameIndex = 0;
      var lastRebuffer = Date.now();
      
      var playing = true;

	  var progress = function() {
		  var currentTimeMillis = Date.now();
		  var playtime = ((frameIndex * 1152 + offset) / sampleRate) + (currentTimeMillis - lastRebuffer) / 1000.0;
		  console.log("amountRead = " + stream.state.amountRead + ", offset = " + mpeg.this_frame);
		  var total = playtime * stream.state.amountRead / mpeg.this_frame;
		  
		  if(playing) {
		      onProgress(playtime, total);
		  }
		  
		  setTimeout(progress, 100);
	  }
	  progress();

      // Create a device.
      var dev = audioLib.AudioDevice(function(sampleBuffer) {
          //console.log("being asked for " + sampleBuffer.length + " bytes");
          var index = 0;
                   
          while(index < sampleBuffer.length) {
              for(var i = 0; i < channelCount; ++i) {
                  sampleBuffer[index++] = synth.pcm.samples[i][offset];
              }
                            
              offset++;
              lastRebuffer = Date.now();
              
              if(offset >= synth.pcm.samples[0].length) {
                  offset = 0;
              
				  frameIndex++;
                  frame = Mad.Frame.decode(frame, mpeg);
                  if(frame == null) {
                      if(stream.error == Mad.Error.BUFLEN) {
                          console.log("End of file!");
                      }
                      console.log("Error! code = " + mpeg.error);
                      playing = false;
                      dev.kill();
                  } else {
                      synth.frame(frame);
                  }
              }
          }
      
      }, channelCount, preBufferSize, sampleRate);
      
    };
    
    var stream = new Mad.AjaxStream(url);
	stream.requestAbsolute(30000, function() {
		playMusic(stream);
	});
    
    return false;
}
