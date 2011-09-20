require('./typed-array.js');
require('../../mad.js');
require('../../synth.js');

var _in = [-24885929,47196,16460,331490,-41214,-9529,22626,8736,-7265,-6506,12615,-7664,11799,-5896,-5173,-4064,5503,-2814,8527,-8558,-2798,-11028,-11343,-4432,6220,2036,-1558,5120,0,0,0,0];
var lo = [-17429241,-16475780,-15459112,-14484372,-13536059,-12581038,-11687286,-10701390,-9665573,-8622052,-7557596,-6432024,-5223547,-3996414,-2651606,-1281770];
var hi = [-18405790,-19328854,-20162190,-20939601,-21600256,-22213828,-22816256,-23239559,-23583918,-23939478,-24126106,-24292333,-24437136,-24456072,-24497924,-24537443];

function fixToFloat(x) {
    return x / (1 << 28);
}

function floatArray(list) {
    var result = [];
    for (var i = 0; i < list.length; i++) {
        result[i] = fixToFloat(list[i]);
    }
    return result;
}

lo = floatArray(lo);
hi = floatArray(hi);

var _lo = [];
var _hi = [];

for (var i = 0; i < 16; i++) {
    _lo[i] = [];
    _hi[i] = [];
}

Mad.Synth.dct32(floatArray(_in), 0, _lo, _hi);

for (var i = 0; i < 16; i++) {
    console.log(Math.abs(_lo[i][0] - lo[i]));
}

for (var i = 0; i < 16; i++) {
    console.log(Math.abs(_hi[i][0] - hi[i]));
}