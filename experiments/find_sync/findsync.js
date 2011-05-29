
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
        var preBufferSize = 32768;
        var sampleRate = frame.header.samplerate;

        synth.frame(frame);
        var offset = 0;

        // Create a device.
        var dev = audioLib.AudioDevice(function(sampleBuffer) {
            console.log("sample buffer type = " + typeof(sampleBuffer) + ", length = " + sampleBuffer.length + ", samples length = " + synth.pcm.samples[0].length);
            var index = 0;
            
            while(index < sampleBuffer.length) {
                //console.log("index = " + index);
                for(var i = 0; i < channelCount; ++i) {
                    //console.log("i = " + i);
                    sampleBuffer[index++] = synth.pcm.samples[i][offset];
                }
                
                offset++;
                
                if(offset >= synth.pcm.samples[0].length) {
                    console.log("Decoding another frame!");
                    frame = Mad.Frame.decode(stream);
                    if(frame == null) {
                        if(stream.error == Mad.Error.BUFLEN) {
                            console.log("End of file!");
                            break;
                        }
                        console.log("Error! code = " + stream.error);
                    }
                    synth.frame(frame);
                }
            }
        }, channelCount, preBufferSize, sampleRate);
    });
    
    return false;
}
