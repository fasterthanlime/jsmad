var fs = require('fs');
var sys = require('sys');

ArrayBuffer = function(size) {  
    var array = new Array(size / 4);

    for (var i = 0; i < array.length; i++) {
        array[i] = 0;
    } 

    return array;
};

Int32Array = function(buffer) {
    return buffer;
};

Float32Array = function(buffer) {
    return buffer;
};

Array.prototype.subarray = function(start) {
    return new Float32Array(this.slice(start));
};

require('../../mad.js');
require('../../id3.js');
require('../../layer3.js');
require('../../synth.js');
require("../../mad.js");
require("../../rq_table.js");
require("../../imdct_s.js");
require("../../huffman.js");
require("../../bit.js");
require("../../stream.js");
require("../../id3.js");
require("../../layer3.js");
require("../../frame.js");
require("../../synth.js");

var data = fs.readFileSync("one_second_of_silence.mp3", "binary");

console.log("Reading a " + Math.round(data.length / 1024) + "KB file");

var stream = new Mad.Stream(data);

ID3_skipHeader(stream);

var STEPS_COUNT = 0;

var frame = null;

while (frame = Mad.Frame.decode(stream)) {
    var synth = new Mad.Synth();
    synth.frame(frame);

    var samples = synth.pcm.samples[0];

    for (var i in samples) {
        sys.print(samples[i] + ',');
    }
}
