
function ID3_skipHeader(stream) {
    // read magic, should be ID3
    var magic = stream.peekChars(3);
    
    if(magic != "ID3") {
        console.log("No ID3 tag in this file!");
        return;
    }
    
    // skip magic
    stream.readChars(3);
    
    // skip flags
    var flags = stream.readChars(3);
    
    // read header length
    var size = stream.readU8() << 21 | stream.readU8() << 14 | stream.readU8() << 7 | stream.readU8();
    console.log("header length = " + size);
    
    // skip over the header
    var header = stream.readChars(size);
    console.log("header = " + header);
    
    stream.ptr.offset = stream.buffer;
}
