
function MadStream(data) {
    if(typeof(data) != "string") {
        console.log("Invalid data type: " + typeof(data));
        return;
    }
  
    this.data = data;
    this.buffer = 0;
    this.bufend = data.length;
}

MadStream.fromFile = function(file, callback) {
    var reader = new FileReader();
    reader.onloadend = function (evt) {
        callback(new MadStream(evt.target.result));
    };
    reader.readAsBinaryString(file);
};

MadStream.prototype.readShort = function(bBigEndian) {
    if(typeof(bBigEndian) == "undefined") {
        bBigEndian = false;
    }
    
    var byte1 = this.readU8();
    var byte2 = this.readU8();

    var iShort = bBigEndian ? (byte1 << 8) + byte2 : (byte2 << 8) + byte1
    if (iShort < 0) iShort += 65536;
    return iShort;
};
    
MadStream.prototype.readSShort = function(bBigEndian) {
    var iUShort = this.readShort(bBigEndian);
    if (iUShort > 32767)
        return iUShort - 65536;
    else
        return iUShort;
};

MadStream.prototype.readU8 = function() {
    var c = this.data.charCodeAt(this.buffer);
    this.buffer++;
    return c;
};

MadStream.prototype.readChars = function(length) {
    var bytes = this.data.slice(this.buffer, this.buffer + length);
    this.buffer += length;
    return bytes;
};
