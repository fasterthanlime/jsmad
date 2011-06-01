
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
        
        var min = 0.0;
        var max = 0.0;
        var mean = 0.0;
        
        var total = 0;

        // Create a device.
        var dev = audioLib.AudioDevice(function(sampleBuffer) {
            total += sampleBuffer.length;
            console.log("being asked for " + sampleBuffer.length + " bytes, total = " + total);
            var index = 0;
            
            while(index < sampleBuffer.length) {
                for(var i = 0; i < channelCount; ++i) {
                    var sample = synth.pcm.samples[i][offset];
                    
                    if(!isNaN(sample)) {
                        sampleBuffer[index++] = Math.min(-1.0, Math.max(1.0, sample));
                        
                        if(min > sample)
                            min = sample;
                        if(max < sample)
                            max = sample;
                        mean = (mean + sample) * 0.5;
                    }
                }
                
                offset++;
                
                if(offset >= synth.pcm.samples[0].length) {
                    offset = 0;
                    console.log("min =  " + min + ", max = " + max + ", mean = " + mean);
                    min = 0; max = 0; mean = 0;
                
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
