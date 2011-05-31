var fs = require('fs');

var array = require('typed-array');

ArrayBuffer     = array.ArrayBuffer;
Int32Array      = array.Int32Array;
Float32Array    = array.Float32Array;

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

var synth = new Mad.Synth();
var frame = Mad.Frame.decode(stream);

if(frame == null) {
    if(stream.error == Mad.Error.BUFLEN) {
        console.log("End of file!");
    }
    console.log("Error! code = " + stream.error);
}

synth.frame(frame);
