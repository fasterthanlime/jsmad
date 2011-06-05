// "use strict";

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

//var data = fs.readFileSync("one_second_beep.mp3", "binary");
//var data = fs.readFileSync("one_second_of_silence.mp3", "binary");
//var data = fs.readFileSync("output.mp3", "binary");
var data = fs.readFileSync("stylo.mp3", "binary");

// console.log("Reading a " + Math.round(data.length / 1024) + "KB file");

var stream = new Mad.Stream(data);
var synth = new Mad.Synth();

if (process.argv[2] == '-d') {
    Debug = {
        iteration: 0,
        huffdecode: fs.createWriteStream('huffdecode-js.txt'),
        sample: fs.createWriteStream('sample-js.txt'),
        pcm: fs.createWriteStream('pcm-js.txt')
    };
}
else {
    Debug = false;
}

ID3_skipHeader(stream);

var frame = new Mad.Frame();
var pcm = [];

while (true) {
    frame = Mad.Frame.decode(frame, stream);

    if (!frame) {
        break;
    }

    synth.frame(frame);

    var samples = synth.pcm.samples[0];

    for (var i = 0; i < synth.pcm.length; i++) {
        pcm.push(samples[i]);
        // sys.print(samples[i].toFixed(8) + "\t");
        // if (i % 8 == 7) sys.print("\n");
    }
}

var buf = new Buffer(pcm.length * 2);
var len = pcm.length;
var max = Math.pow(2, 6);

for (var i = 0; i < len; i++) {
    var sample = pcm[i] * max;
    buf[(i * 2) + 0] = (sample & 0xff00) >> 8;
    buf[(i * 2) + 1] = sample & 0xff;
    if (Debug) {
        Debug.pcm.write(pcm[i].toFixed(8) + "\n");        
    }
}

fs.writeFileSync("stylo.raw", buf, 'binary');

if (Debug) {
    Debug.huffdecode.end();
    Debug.sample.end();
    Debug.pcm.end();    
}
