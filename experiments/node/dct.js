require('./typed-array.js');
require('../../mad.js');
require('../../synth.js');

var _in = [6,6,11,15,-10,10,14,17,-12,-13,36,6,15,-50,36,58,-31,18,-62,58,14,-54,82,-247,120,493,-340,117,-101,-17,0,0,];
var lo = [-103,-132,641,-768,519,34,-565,1014,-1095,568,377,-824,649,-646,543,-278,];
var hi = [306,-751,462,83,-368,443,-396,233,-14,-183,242,-179,92,-25,4,195,];


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

var _lo = [];
var _hi = [];

for (var i = 0; i < 16; i++) {
    _lo[i] = [];
    _hi[i] = [];
}

Mad.Synth.dct32(floatArray(_in), 0, _lo, _hi);

console.log(_lo);
console.log(floatArray(lo));