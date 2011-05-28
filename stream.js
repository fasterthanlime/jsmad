
function MadStream(data) {
    if(typeof(data) != "string") {
      console.log("Invalid data type: " + typeof(data));
      return;
    }
  
    this.data = data;
    this.buffer = 0;
    this.bufend = data.length;
}

MadStream.prototype.readU8 = function() {
    var c = this.data.charCodeAt(this.buffer);
    this.buffer++;
    return c;
}

MadStream.prototype.readChars = function(length) {
    var bytes = this.data.slice(this.buffer, this.buffer + length);
    this.buffer += length;
    return bytes;
}
