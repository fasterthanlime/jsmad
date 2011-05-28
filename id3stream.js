var decodeTextFrame = function(header, stream) {
    var encoding = stream.readU8();
    var data = stream.read(header['length'] - 1);
    
    return {
        'header': header,
        'encoding': encoding,
        'description': data
    };
}

var decodeCommentFrame = function(header, stream) {
    var encoding = stream.readU8();
    var language = stream.read(3);
    
    var data = stream.read(header['length'] - 4);
    
    var array = data.split("\0");
    
    return {
        'header': header,
        'encoding': encoding,
        'language': language,
        'description': array[0],
        'value': array[1],
    };
}

var decodeUserDefinedLink = function(header, stream) {
    var encoding = stream.readU8();
    var data = stream.read(header['length'] - 1);
    
    var array = data.split("\0");
    
    return {
        'header': header,
        'encoding': encoding,
        'description': array[0],
        'value': array[1],
    };
}

Mad.ID3Stream = function(header, stream) {
    this.offset = 0;
    
    this.header = header;
    this.stream = stream;
    
    this.decoders = {
        /* Identification Frames */
        'TIT1': decodeTextFrame,
        'TIT2': decodeTextFrame,
        'TIT3': decodeTextFrame,
        'TALB': decodeTextFrame,
        'TOAL': decodeTextFrame,
        'TRCK': decodeTextFrame,
        'TPOS': decodeTextFrame,
        'TSST': decodeTextFrame,
        'TSRC': decodeTextFrame,
        
        /* Involved Persons Frames */
        'TPE1': decodeTextFrame,
        'TPE2': decodeTextFrame,
        'TPE3': decodeTextFrame,
        'TPE4': decodeTextFrame,
        'TOPE': decodeTextFrame,
        'TEXT': decodeTextFrame,
        'TOLY': decodeTextFrame,
        'TCOM': decodeTextFrame,
        'TMCL': decodeTextFrame,
        'TIPL': decodeTextFrame,
        'TENC': decodeTextFrame,
        
        /* Derived and Subjective Properties Frames */
        'TBPM': decodeTextFrame,
        'TLEN': decodeTextFrame,
        'TKEY': decodeTextFrame,
        'TLAN': decodeTextFrame,
        'TCON': decodeTextFrame,
        'TFLT': decodeTextFrame,
        'TMED': decodeTextFrame,
        'TMOO': decodeTextFrame,
        
        /* Rights and Licence Frames */
        'TCOP': decodeTextFrame,
        'TPRO': decodeTextFrame,
        'TPUB': decodeTextFrame,
        'TOWN': decodeTextFrame,
        'TRSN': decodeTextFrame,
        'TRSO': decodeTextFrame,
        
        /* Other Text Frames */
        'TOFN': decodeTextFrame,
        'TDLY': decodeTextFrame,
        'TDEN': decodeTextFrame,
        'TDOR': decodeTextFrame,
        'TDRC': decodeTextFrame,
        'TDRL': decodeTextFrame,
        'TDTG': decodeTextFrame,
        'TSSE': decodeTextFrame,
        'TSOA': decodeTextFrame,
        'TSOP': decodeTextFrame,
        'TSOT': decodeTextFrame,
        
        /* Comment Frame */
        
        'COMM': decodeCommentFrame,
        
        /* User Defined URL Link Frame */
        
        'WXXX': decodeUserDefinedLink,
        
        /* Deprecated ID3v2 Frames */
        'TDAT': decodeTextFrame,
        'TIME': decodeTextFrame,
        'TORY': decodeTextFrame,
        'TRDA': decodeTextFrame,
        'TSIZ': decodeTextFrame,
        'TYER': decodeTextFrame
    };
    
    this.names = {
        /* Identification Frames */
        'TIT1': 'Content group description',
        'TIT2': 'Title/Songname/Content description',
        'TIT3': 'Subtitle/Description refinement',
        'TALB': 'Album/Movie/Show title',
        'TOAL': 'Original album/movie/show title',
        'TRCK': 'Track number/Position in set',
        'TPOS': 'Part of a set',
        'TSST': 'Set subtitle',
        'TSRC': 'ISRC',
        
        /* Involved Persons Frames */
        'TPE1': 'Lead artist/Lead performer/Soloist/Performing group',
        'TPE2': 'Band/Orchestra/Accompaniment',
        'TPE3': 'Conductor',
        'TPE4': 'Interpreted, remixed, or otherwise modified by',
        'TOPE': 'Original artist/performer',
        'TEXT': 'Lyricist/Text writer',
        'TOLY': 'Original lyricist/text writer',
        'TCOM': 'Composer',
        'TMCL': 'Musician credits list',
        'TIPL': 'Involved people list',
        'TENC': 'Encoded by',
        
        /* Derived and Subjective Properties Frames */
        'TBPM': 'BPM',
        'TLEN': 'Length',
        'TKEY': 'Initial key',
        'TLAN': 'Language',
        'TCON': 'Content type',
        'TFLT': 'File type',
        'TMED': 'Media type',
        'TMOO': 'Mood',
        
        /* Rights and Licence Frames */
        'TCOP': 'Copyright message',
        'TPRO': 'Produced notice',
        'TPUB': 'Publisher',
        'TOWN': 'File owner/licensee',
        'TRSN': 'Internet radio station name',
        'TRSO': 'Internet radio station owner',
        
        /* Other Text Frames */
        'TOFN': 'Original filename',
        'TDLY': 'Playlist delay',
        'TDEN': 'Encoding time',
        'TDOR': 'Original release time',
        'TDRC': 'Recording time',
        'TDRL': 'Release time',
        'TDTG': 'Tagging time',
        'TSSE': 'Software/Hardware and settings used for encoding',
        'TSOA': 'Album sort order',
        'TSOP': 'Performer sort order',
        'TSOT': 'Title sort order',
        
        /* Comment Frame */
        
        'COMM': 'Comment',
        
        /* User Defined URL Link Frame */
        
        'WXXX': 'User defined URL link',
        
        /* Deprecated ID3v2 frames */
        'TDAT': 'Date',
        'TIME': 'Time',
        'TORY': 'Original release year',
        'TRDA': 'Recording dates',
        'TSIZ': 'Size',
        'TYER': 'Year'
    };
}

Mad.ID3Stream.prototype.readFrame = function() {
    if (this.offset >= this.header.size) {
        return null;
    }
    
    var identifier = this.stream.read(4);
    
    if (identifier.charCodeAt(0) == 0) {
        this.offset = this.header.size + 1;
        
        return null;
    }
    
    var length = this.stream.readU32(true);
    var flags = this.stream.readU16(true);
    
    var header = {
        'identifier': identifier,
        'length': length,
        'flags': flags
    };
    
    var result = null;
    
    if (this.decoders[identifier]) {
        result = this.decoders[identifier](header, this.stream);
    } else {
        result = {
            'identifier': identifier,
            'header': header
        };
        
        this.stream.read(length);
    }
    
    result['Name'] = this.names[identifier] ? this.names[identifier] : 'UNKNOWN';
    
    this.offset += 10 + length;
    
    return result;
}

Mad.ID3Stream.prototype.read = function() {
    if (!this.array) {
        this.array = [], frame = null;
        
        while (frame = this.readFrame()) {
            this.array.push(frame);
        }
    }
    
    return this.array;
}
