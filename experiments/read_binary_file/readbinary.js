
console.log("readbinary.js loaded");

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

function ID3_skipHeader(stream) {
    // read magic, should be ID3
    var magic = stream.readChars(3);
    console.log("Magic = " + magic);
    if(magic != "ID3") {
      console.log("Not an MP3 file or not a recognized variant of MP3! Magic = " + magic + ", should be ID3");
    }
    
    // skip flags
    var flags = stream.readChars(2);
    
    // read header length
    var size = stream.readU8() << 21 | stream.readU8() << 14 | stream.readU8() << 7 | stream.readU8();
    console.log("header length = " + size);
    
    // skip over the header
    var header = stream.readChars(size);
    console.log("header = " + header);
}

function readFile() {
    console.log("readFile called");

    // uploadData is a form element
    // fileChooser is input element of type 'file'
    var file = document.forms['uploadData']['fileChooser'].files[0];
    
    if(!file) return;
    
    // Perform file ops
    console.log("Got file = " + file.name + ", type = " + typeof(file));
    var reader = new FileReader();
    
    reader.onloadend = function (evt) {
      var stream = new MadStream(evt.target.result);
      
      console.log("Reading a " + Math.round(stream.bufend / 1024) + "KB file");
      ID3_skipHeader(stream);
    };
    
    reader.readAsBinaryString(file);
    return false;
}
