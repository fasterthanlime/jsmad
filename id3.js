
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
