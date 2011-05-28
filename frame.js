
Mad.Layer = {
    I: 1,
    II: 2,
    III: 3,
};

Mad.Mode = {
    SINGLE_CHANNEL        : 0,
    MAD_MODE_DUAL_CHANNEL : 1,      /* dual channel */
    MAD_MODE_JOINT_STEREO : 2,      /* joint (MS/intensity) stereo */
    MAD_MODE_STEREO       : 3       /* normal LR stereo */
};

Mad.Emphasis = {
    NONE       : 0,     /* no emphasis */
    _50_15_US  : 1,     /* 50/15 microseconds emphasis */
    CCITT_J_17 : 3,     /* CCITT J.17 emphasis */
    RESERVED   : 2      /* unknown emphasis */
};

Mad.Header = function () {
    this.layer          = 0;            /* audio layer (1, 2, or 3) */
    this.mode           = 0;            /* channel mode (see above) */
    this.mode_extension = 0;            /* additional mode info */
    this.emphasis       = 0;            /* de-emphasis to use (see above) */    

    this.bitrate        = 0;            /* stream bitrate (bps) */
    this.samplerate     = 0;            /* sampling frequency (Hz) */

    this.crc_check      = 0;            /* frame CRC accumulator */
    this.crc_target     = 0;            /* final target CRC checksum */

    this.flags          = 0;            /* flags (see below) */
    this.private_bits   = 0;            /* private bits (see below) */

    //this.duration       = mad_timer_zero;         /* audio playing time of frame */
};

Mad.Header.nchannels = function () {
    return this.mode == 0 ? 1 : 2;
}

Mad.Header.nbsamples = function() {
    return (this.layer == Mad.Layer.I ? 12 : 
        ((this.layer == Mad.Layer.III && (this.flags & Mad.Flag.LSF_EXT)) ? 18 : 16));
}

/* libmad's decode_header */
Mad.Header.actually_decode = function(stream) {
    var header = new Mad.Header();
    
    // TODO: actually decode it.
    
    return header;
}

/* libmad's mad_header_decode */
Mad.Header.decode = function(stream) {
    var header = null;
    
    // those are actually pointers. javascript powa.
    var ptr = stream.next_frame;
    var end = stream.bufend;
    var pad_slot = 0;
    var N = 0;
    
    if (stream.data == null) {
        stream.error = Mad.Error.BUFPTR;
        return null;
    }

    /* stream skip */
    if (stream.skiplen) {
        if (!stream.sync)
            ptr = stream.this_frame;

        if (end - ptr < stream.skiplen) {
            stream.skiplen   -= end - ptr;
            stream.next_frame = end;

            stream.error = Mad.Error.BUFLEN;
            return null;
        }

        ptr += stream.skiplen;
        stream.skiplen = 0;

        stream.sync = 1;
    }

    // emulating goto in JS, yay! this was a 'sync:' label
    var syncing = true;

    while(syncing) {
        syncing = false;
 
        /* synchronize */
        if (stream.sync) {
            if (end - ptr < Mad.BUFFER_GUARD) {
                stream.next_frame = ptr;

                stream.error = Mad.Error.BUFLEN;
                return null;
            } else if (!(stream.getU8(ptr) == 0xff && (stream.getU8(ptr + 1) & 0xe0) == 0xe0)) {
                /* mark point where frame sync word was expected */
                stream.this_frame = ptr;
                stream.next_frame = ptr + 1;

                stream.error = Mad.Error.LOSTSYNC;
                return null;
            }
        } else {
            stream.ptr = new Mad.Bit(stream.data, ptr);
            
            if (stream.doSync() == -1) {
                if (end - stream.next_frame >= Mad.BUFFER_GUARD)
                    stream.next_frame = end - Mad.BUFFER_GUARD;
                stream.error = Mad.Error.BUFLEN;
                return null;
            }

            ptr = stream.ptr.nextbyte();
        }

    /* begin processing */
    stream.this_frame = ptr;
    stream.next_frame = ptr + 1;  /* possibly bogus sync word */

    stream.ptr = new Mad.Bit(stream.data, stream.this_frame);
    
    header = Mad.Header.actually_decode(stream);
    if(header == null) return null; // well Duh^2

    /* calculate frame duration */
    //mad_timer_set(&header.duration, 0, 32 * MAD_NSBSAMPLES(header), header.samplerate);

    /* calculate free bit rate */
//    if (header.bitrate == 0) {
//        if ((stream.freerate == 0 || !stream.sync ||
//                (header.layer == MAD_LAYER_III && stream.freerate > 640000)) &&
//                free_bitrate(stream, header) == -1)
//            return null;
//
//        header.bitrate = stream.freerate;
//        header.flags  |= Mad.Flag.FREEFORMAT;
//    }
//
//    /* calculate beginning of next frame */
//    pad_slot = (header.flags & Mad.Flag.PADDING) ? 1 : 0;
//
//    if (header.layer == MAD_LAYER_I)
//        N = ((12 * header.bitrate / header.samplerate) + pad_slot) * 4;
//    else {
//        unsigned int slots_per_frame;
//
//        slots_per_frame = (header.layer == MAD_LAYER_III &&
//               (header.flags & Mad.Flag.LSF_EXT)) ? 72 : 144;
//
//        N = (slots_per_frame * header.bitrate / header.samplerate) + pad_slot;
//    }
//
//    /* verify there is enough data left in buffer to decode this frame */
//    if (N + Mad.BUFFER_GUARD > end - stream.this_frame) {
//        stream.next_frame = stream.this_frame;
//
//        stream.error = Mad.Error.BUFLEN;
//        return null;
//    }
//
//    stream.next_frame = stream.this_frame + N;
//
//    if (!stream.sync) {
//        /* check that a valid frame header follows this frame */
//        ptr = stream.next_frame;
//        if (!(ptr[0] == 0xff && (ptr[1] & 0xe0) == 0xe0)) {
//            ptr = stream.next_frame = stream.this_frame + 1;
//      
//            // emulating 'goto sync'
//            syncing = true;
//            continue;
//        }
//        stream.sync = 1;
//    }
//
    } // end of goto emulation (label 'sync')
    
    header.flags |= Mad.Flag.INCOMPLETE;
    return header;
}

Mad.Frame = function () {
    this.header = new Mad.Header();     /* MPEG audio header */
    
    this.options = 0;                   /* decoding options (from stream) */

    this.sbsample = new ArrayBuffer(2 * 36 * 32);   /* synthesis subband filter samples */
    this.overlap  = new ArrayBuffer(2 * 32 * 18);   /* Layer III block overlap data */
};

Mad.Frame.decode = function(stream) {
    var frame = new Mad.Frame();

    frame.options = stream.options;
    
    /* header() */
    /* error_check() */

    if (!(frame.header.flags & Mad.Flag.INCOMPLETE)) {
        frame.header = Mad.Header.decode(stream);
        if(frame.header == null) {
            // something went wrong
            return null;
        }
    }

    /* audio_data() */

    frame.header.flags &= ~Mad.Flag.INCOMPLETE;

    // TODO: actually decode the data :)
    /*
    if (decoder_table[frame.header.layer - 1](stream, frame) == -1) {
    if (!MAD_RECOVERABLE(stream.error))
        stream.next_frame = stream.this_frame;
        goto fail;
    }
    */

    return frame;
}

Mad.sbsampleIndex = function (i, j, k) {
    return i * 36 * 32 + j * 32 + k;
}

Mad.overlapIndex = function (i, j, k) {
    return i * 32 * 18 + j * 18 + k;
}

Mad.Flag = {
    NPRIVATE_III   : 0x0007,   /* number of Layer III private bits */
    INCOMPLETE : 0x0008,   /* header but not data is decoded */

    PROTECTION : 0x0010,   /* frame has CRC protection */
    COPYRIGHT  : 0x0020,   /* frame is copyright */
    ORIGINAL   : 0x0040,   /* frame is original (else copy) */
    PADDING    : 0x0080,   /* frame has additional slot */

    I_STEREO   : 0x0100,   /* uses intensity joint stereo */
    MS_STEREO  : 0x0200,   /* uses middle/side joint stereo */
    FREEFORMAT : 0x0400,   /* uses free format bitrate */

    LSF_EXT    : 0x1000,   /* lower sampling freq. extension */
    MC_EXT : 0x2000,   /* multichannel audio extension */
    MPEG_2_5_EXT   : 0x4000    /* MPEG 2.5 (unofficial) extension */
};

Mad.Private = {
    HEADER  : 0x0100,   /* header private bit */
    III : 0x001f    /* Layer III private bits (up to 5) */
};
