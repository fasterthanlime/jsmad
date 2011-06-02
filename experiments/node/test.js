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

var data = fs.readFileSync("one_second_beep.mp3", "binary");
// var data = fs.readFileSync("one_second_of_silence.mp3", "binary");

console.log("Reading a " + Math.round(data.length / 1024) + "KB file");

var stream = new Mad.Stream(data);

ID3_skipHeader(stream);

var STEPS_COUNT = 0;

var frame = null;
var synth = new Mad.Synth();
var pcm = [];

while (frame = Mad.Frame.decode(stream)) {
    synth.frame(frame);

    var samples = synth.pcm.samples[0];

    for (var i = 0; i < samples.length; i++) {
        pcm.push(samples[i]);
    }
}

var buf = new Buffer(pcm.length * 4);
var len = pcm.length / 4;
var max = Math.pow(2, 32) / 10;

for (var i = 0; i < len; i++) {
    var sample = pcm[i * 4] * max;
    buf[i + 0] = (sample & 0xff000000) >> 24;
    buf[i + 1] = (sample & 0x00ff0000) >> 16;
    buf[i + 2] = (sample & 0x0000ff00) >> 8;
    buf[i + 3] = (sample & 0x000000ff) >> 0;
}

fs.writeFileSync("out.raw", buf, 'binary');

console.log("error code: " + stream.error);