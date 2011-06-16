
function readFile() {
    // uploadData is a form element
    // fileChooser is input element of type 'file'
    var file = document.forms['uploadData']['fileChooser'].files[0];
    
    if (!file) {
        return;
    }
    
    new Mad.FileStream(file, function (stream) {
      mp3 = new Mad.MP3File(stream);
      
      id3 = mp3.getID3v2Stream()
      
      if (id3) {
          id3 = id3.toHash();
          
          var id3element = document.getElementById('ID3');
          
          id3string = "<div class='player'><div class='picture'>";
          
          var pictures = id3['Attached picture'];
          
          if (pictures) {
              var mime = pictures[0].mime;
              var enc  = btoa(pictures[0].value);
              id3string += "<img class='picture' src='data:" + mime + ';base64,' + enc + "' />";
          }

          id3string += "<a href='#' class='button play'></a>";
          id3string += "<div class='timeline'></div>";

          id3string += "</div></div>";
          id3string += "<div class='info'>";
          id3string += "<h2>" + id3['Title/Songname/Content description'] + "</h2>";
          id3string += "<h3>" + id3['Lead artist/Lead performer/Soloist/Performing group'] + "</h3>";
          id3string += "<div class='meta'>";
          id3string += "<p><strong>Album:</strong> " + id3['Album/Movie/Show title'] + "</p>";
          id3string += "<p><strong>Track:</strong> " + id3['Track number/Position in set'] + "</p>";
          id3string += "<p><strong>Year:</strong> " + id3['Year'] + "</p>";
          id3string += "</div>";
          id3string += "</div>";
          

          
          id3element.innerHTML = id3string;
      }
      
      mpeg = mp3.getMpegStream();
      
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

      // Create a device.
      var dev = audioLib.AudioDevice(function(sampleBuffer) {
          //console.log("being asked for " + sampleBuffer.length + " bytes");
          var index = 0;
          
          while(index < sampleBuffer.length) {
              for(var i = 0; i < channelCount; ++i) {
                  sampleBuffer[index++] = synth.pcm.samples[i][offset];
              }
              
              offset++;
              
              if(offset >= synth.pcm.samples[0].length) {
                  offset = 0;
              
                  frame = Mad.Frame.decode(frame, mpeg);
                  if(frame == null) {
                      if(stream.error == Mad.Error.BUFLEN) {
                          console.log("End of file!");
                      }
                      console.log("Error! code = " + mpeg.error);
                      dev.kill();
                  } else {
                      synth.frame(frame);
                  }
              }
          }
      
      }, channelCount, preBufferSize, sampleRate);
      
    });
    
    return;
}
