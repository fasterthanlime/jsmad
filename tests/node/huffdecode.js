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

var data = fs.readFileSync("one_second_of_silence.mp3", "binary");
// var data = fs.readFileSync("soul-2.mp3", "binary");

console.log("Reading a " + Math.round(data.length / 1024) + "KB file");

var stream = new Mad.Stream(data);

ID3_skipHeader(stream);

var STEPS_COUNT = 0;

var frame = null;

frame = Mad.Frame.decode(stream); // apparently first frame has nothing to decode
frame = Mad.Frame.decode(stream);

console.log("error code: " + stream.error);
