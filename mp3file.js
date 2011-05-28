Mad.MP3File = function(stream) {
    this.stream = stream;
}

Mad.MP3File.prototype.getID3v2Header = function() {
    if (this.stream.get(0, 3) == "ID3") {
        var headerStream = new Mad.SubStream(this.stream, 0);
        
        headerStream.read(3); // 'ID3'
        
        var major = headerStream.readU8();
        var minor = headerStream.readU8();
        
        var flags = headerStream.readU8();
        
        var size = headerStream.readSyncInteger();
        
        return { 'version': '2.' + major + '.' + minor, 'flags': flags, 'size': size };
    } else {
        return null;
    }
}

Mad.MP3File.prototype.getID3v2Stream = function() {
    var header = this.getID3v2Header();
    
    if (header) {
        return new Mad.ID3Stream(header, new Mad.SubStream(this.stream, 10));
    } else {
        return null;
    }
}

Mad.MP3File.prototype.getMpegStream = function() {
    var id3header = this.getID3v2Header;
    
    if (id3header) {
        return new Mad.SubStream(this.stream, 10 + id3header['size']);
    } else {
        return new Mad.SubStream(this.stream, 0);
    }
}