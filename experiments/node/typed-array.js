
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

Float64Array = function(buffer) {
    return buffer;
};

Array.prototype.subarray = function(start) {
    return new Float32Array(this.slice(start));
};
