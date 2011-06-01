var fs = require('fs');
var sys = require('sys');

require('./typed-array.js');
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

// var data = fs.readFileSync("one_second_of_silence.mp3", "binary");
// var data = fs.readFileSync("one_second_beep.mp3", "binary");
 var data = fs.readFileSync("output.mp3", "binary");
// var data = fs.readFileSync("soul-2.mp3", "binary");

console.log("Reading a " + Math.round(data.length / 1024) + "KB file");

var stream = new Mad.Stream(data);

ID3_skipHeader(stream);

var STEPS_COUNT = 0;

var frame = null;

var allmin = 0;
var allmax = 0;

while (frame = Mad.Frame.decode(stream)) {
    var synth = new Mad.Synth();
    synth.frame(frame);

    var samples = synth.pcm.samples[0];

    var min = 0.0;
    var max = 0.0;
    var mean = 0.0;
    
    for (var i = 0; i < samples.length; i++) {
        var sample = samples[i];
        mean += (sample / samples.length);
        if(min > sample) min = sample;
        if(max < sample) max = sample;
    }

    console.log("min = " + min + ", max = " + max + ", mean = " + mean);
    if(allmin > min) allmin = min;
    if(allmax < max) allmax = max;
}

console.log("allmin = " + allmin + ", allmax = " + allmax);

console.log("error code: " + stream.error);
