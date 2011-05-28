
function readFile() {
    // uploadData is a form element
    // fileChooser is input element of type 'file'
    var file = document.forms['uploadData']['fileChooser'].files[0];
    if(!file) return;
    
    // Perform file ops
    MadStream.fromFile(file, function(stream) {
        console.log("Reading a " + Math.round(stream.bufend / 1024) + "KB file");
        
        var channelCount = 2;
        var preBufferSize = stream.bufend;
        var sampleRate = 44100;

        // Create a device.
        var dev = audioLib.AudioDevice(function(sampleBuffer){
            // Fill the buffer here
            console.log("sample buffer type = " + typeof(sampleBuffer) + ", length = " + sampleBuffer.length);
            
            var i = 0;
            while(i < sampleBuffer.length) {
                var intValue = stream.readSShort();
                sampleBuffer[i++] = intValue / 32768.0;
            }
        }, channelCount, preBufferSize / 2, sampleRate);

        // Note that all the arguments are optional, so if you want to create a write-only device, you can leave the arguments blank.
        // Writing buffers:
        dev.writeBuffer(buffer);
    });
    
    return false;
}



