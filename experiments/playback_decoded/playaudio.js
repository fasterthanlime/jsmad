var channelCount = 2;

// Create a device.
var dev = audioLib.AudioDevice(function(sampleBuffer){
    // Fill the buffer here.
}, channelCount, preBufferSize, sampleRate);

// Note that all the arguments are optional, so if you want to create a write-only device, you can leave the arguments blank.
// Writing buffers:
dev.writeBuffer(buffer);
