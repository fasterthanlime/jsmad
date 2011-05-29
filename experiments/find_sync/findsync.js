
function readFile() {
    // uploadData is a form element
    // fileChooser is input element of type 'file'
    var file = document.forms['uploadData']['fileChooser'].files[0];
    if(!file) return;
    
    // Perform file ops
    Mad.Stream.fromFile(file, function(stream) {
        //console.log("Reading a " + Math.round(stream.bufend / 1024) + "KB file");
        ID3_skipHeader(stream);
        
        var STEPS_COUNT = 0;
        
        var synth = new Mad.Synth();
        var frame = Mad.Frame.decode(stream);
        if(frame == null) {
            if(stream.error == Mad.Error.BUFLEN) {
                console.log("End of file!");
            }
            console.log("Error! code = " + stream.error);
        }
        
        var channelCount = frame.header.nchannels();
        var preBufferSize = file.length;
        var sampleRate = frame.header.samplerate;

        console.log("playing " + channelCount + " channels, samplerate = " + sampleRate + " audio, mode " + frame.header.mode);

        synth.frame(frame);
        var offset = 0;

        // Create a device.
        var dev = audioLib.AudioDevice(function(sampleBuffer) {
            var index = 0;
            
            while(index < sampleBuffer.length) {
                //console.log("index = " + index);
                for(var i = 0; i < channelCount; ++i) {
                    //console.log("i = " + i);
                    sampleBuffer[index++] = synth.pcm.samples[i][offset] / 8.0;
                    //console.log(synth.pcm.samples[i][offset] / 8.0);
                }
                
                offset++;
                
                if(offset >= synth.pcm.samples[0].length) {
                    offset = 0;
                    
                    //if(STEPS_COUNT++ > 10) {
                    //    console.log("STEPS_COUNT = " + STEPS_COUNT + ", killing");
                    //    dev.kill();
                    //}
                
                    frame = Mad.Frame.decode(stream);
                    if(frame == null) {
                        if(stream.error == Mad.Error.BUFLEN) {
                            console.log("End of file!");
                            dev.kill();
                        }
                        console.log("Error! code = " + stream.error);
                    } else {
                        synth.frame(frame);
                    }
                }
            }
        
        }, channelCount, preBufferSize, sampleRate);
    });
    
    return false;
}
