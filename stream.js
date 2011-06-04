
Mad.Error = {
  NONE     : 0x0000,    /* no error */

  BUFLEN           : 0x0001,    /* input buffer too small (or EOF) */
  BUFPTR           : 0x0002,    /* invalid (null) buffer pointer */

  NOMEM    : 0x0031,        /* not enough memory */

  LOSTSYNC         : 0x0101,    /* lost synchronization */
  BADLAYER         : 0x0102,    /* reserved header layer value */
  BADBITRATE       : 0x0103,    /* forbidden bitrate value */
  BADSAMPLERATE  : 0x0104,      /* reserved sample frequency value */
  BADEMPHASIS      : 0x0105,    /* reserved emphasis value */

  BADCRC               : 0x0201,        /* CRC check failed */
  BADBITALLOC      : 0x0211,    /* forbidden bit allocation value */
  BADSCALEFACTOR : 0x0221,      /* bad scalefactor index */
  BADMODE        : 0x0222,      /* bad bitrate/mode combination */
  BADFRAMELEN      : 0x0231,    /* bad frame length */
  BADBIGVALUES   : 0x0232,      /* bad big_values count */
  BADBLOCKTYPE   : 0x0233,      /* reserved block_type */
  BADSCFSI         : 0x0234,    /* bad scalefactor selection info */
  BADDATAPTR       : 0x0235,    /* bad main_data_begin pointer */
  BADPART3LEN      : 0x0236,    /* bad audio data length */
  BADHUFFTABLE   : 0x0237,      /* bad Huffman table select */
  BADHUFFDATA      : 0x0238,    /* Huffman data overrun */
  BADSTEREO        : 0x0239     /* incompatible block_type for JS */
};

Mad.BUFFER_GUARD = 8;
Mad.BUFFER_MDLEN = (511 + 2048 + Mad.BUFFER_GUARD);

Mad.Stream = function (data) {
    if(typeof(data) != "string") {
        console.log("Invalid data type: " + typeof(data));
        return;
    }
  
    this.data = data; /* actual buffer (js doesn't have pointers!) */
    this.buffer = 0; /* input bitstream buffer */
    this.bufend = data.length; /* input bitstream buffer */
    this.skiplen = 0; /* bytes to skip before next frame */

    this.sync = 0;                      /* stream sync found */
    this.freerate = 0;          /* free bitrate (fixed) */

    this.this_frame = 0;        /* start of current frame */
    this.next_frame = 0;        /* start of next frame */
    
    this.ptr = new Mad.Bit(this.data, this.buffer); /* current processing bit pointer */
    
    this.anc_ptr = /* MadBit */ null;           /* ancillary bits pointer */
    this.anc_bitlen = 0;                            /* number of ancillary bits */

    this.main_data = /* string */ Mad.mul("\0", Mad.BUFFER_MDLEN); /* Layer III main_data() */
    this.md_len = 0; /* bytes in main_data */

    var options = 0;                            /* decoding options (see below) */
    var error = Mad.Error.NONE;                 /* error code (see above) */
};

Mad.Stream.fromFile = function(file, callback) {
    var reader = new FileReader();
    reader.onloadend = function (evt) {
        callback(new Mad.Stream(evt.target.result));
    };
    reader.readAsBinaryString(file);
};

Mad.Stream.prototype.readShort = function(bBigEndian) {
    if(typeof(bBigEndian) == "undefined") {
        bBigEndian = false;
    }
    
    var byte1 = this.readU8();
    var byte2 = this.readU8();

    var iShort = bBigEndian ? (byte1 << 8) + byte2 : (byte2 << 8) + byte1;
    if (iShort < 0) iShort += 65536;
    return iShort;
};
    
Mad.Stream.prototype.readSShort = function(bBigEndian) {
    var iUShort = this.readShort(bBigEndian);
    if (iUShort > 32767)
        return iUShort - 65536;
    else
        return iUShort;
};

Mad.Stream.prototype.getU8 = function(index) {
    return this.data.charCodeAt(index);
};


Mad.Stream.prototype.readU8 = function() {
    var c = this.data.charCodeAt(this.buffer);
    this.buffer++;
    return c;
};

Mad.Stream.prototype.readChars = function(length) {
    var bytes = this.data.slice(this.buffer, this.buffer + length);
    this.buffer += length;
    return bytes;
};

Mad.Stream.prototype.peekChars = function(length) {
    return this.data.slice(this.buffer, this.buffer + length);
}

/*
 * NAME:        stream->sync()
 * DESCRIPTION: locate the next stream sync word
 */
Mad.Stream.prototype.doSync = function() {
    var ptr = this.ptr.nextbyte();
    var end = this.bufend;

    while (ptr < end - 1 &&
            !(this.getU8(ptr) == 0xff && (this.getU8(ptr + 1) & 0xe0) == 0xe0))
        ++ptr;

    if (end - ptr < Mad.BUFFER_GUARD)
        return -1;

    this.ptr = new Mad.Bit(this.data, ptr);
    return 0;
}


