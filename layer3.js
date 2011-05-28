
Mad.SideInfo = function() {
    this.gr = []; // array of Mad.Granule
    this.scfsi = []; // array of ints?
};

Mad.Granule = function() {
    this.ch = []; // list of Mad.Channel    
}

Mad.Channel = function() {
    this.table_select = []; // list of Numbers (I guess)
}

/*
 * NAME:	III_sideinfo()
 * DESCRIPTION:	decode frame side information from a bitstream
 * 
 * Since several values are passed by reference to this function, instead
 * we're just returning a hash containing:
 * {
 *   ptr (Mad.Bit)
 *   sideinfo (Mad.Sideinfo) 
 *   data_bitlen (Number)
 *   priv_bitlen (Number)
 * }
 */
Mad.III_sideinfo = function (ptr, nch, lsf) {
    
    var si = new Mad.SideInfo();
    var result = Mad.Error.NONE;

    var data_bitlen = 0;
    var priv_bitlen = lsf ? ((nch == 1) ? 1 : 2) : ((nch == 1) ? 5 : 3);
    
    si.main_data_begin = ptr.read(lsf ? 8 : 9);
    si.private_bits    = ptr.read(priv_bitlen);

    var ngr = 1;
    if (!lsf) {
        ngr = 2;

        for (ch = 0; ch < nch; ++ch)
            si.scfsi[ch] = ptr.read(4);
    }

    for (gr = 0; gr < ngr; ++gr) {
        var granule = new Mad.Granule();
        si.gr[gr] = granule;
        
        for (ch = 0; ch < nch; ++ch) {
            var channel = new Mad.Channel();
            granule.ch[ch] = channel;
            
            channel.part2_3_length    = ptr.read(12);
            channel.big_values        = ptr.read(9);
            channel.global_gain       = ptr.read(8);
            channel.scalefac_compress = ptr.read(lsf ? 9 : 4);

            data_bitlen += channel.part2_3_length;

            if (channel.big_values > 288 && result == 0)
                result = Mad.Error.BADBIGVALUES;

            channel.flags = 0;

            /* window_switching_flag */
            if (ptr.read(1)) {
                channel.block_type = ptr.read(2);

                if (channel.block_type == 0 && result == 0)
                  result = Mad.Error.BADBLOCKTYPE;

                if (!lsf && channel.block_type == 2 && si.scfsi[ch] && result == 0)
                  result = Mad.Error.BADSCFSI;

                channel.region0_count = 7;
                channel.region1_count = 36;

                if (ptr.read(1))
                  channel.flags |= mixed_block_flag;
                else if (channel.block_type == 2)
                  channel.region0_count = 8;

                for (i = 0; i < 2; ++i)
                  channel.table_select[i] = ptr.read(5);

                for (i = 0; i < 3; ++i)
                  channel.subblock_gain[i] = ptr.read(3);
            } else {
                channel.block_type = 0;

                for (i = 0; i < 3; ++i)
                    channel.table_select[i] = ptr.read(5);

                channel.region0_count = ptr.read(4);
                channel.region1_count = ptr.read(3);
            }

            /* [preflag,] scalefac_scale, count1table_select */
            channel.flags |= ptr.read(lsf ? 2 : 3);
        }
    }

    return {
        ptr: ptr,
        si: si,
        data_bitlen: data_bitlen,
        priv_bitlen: priv_bitlen
    };
}

/*
 * NAME:	layer.III()
 * DESCRIPTION:	decode a single Layer III frame
 */
Mad.layer_III = function (stream, frame) {
    var header = frame.header;
    var nch, next_md_begin = 0;
    var si_len, data_bitlen, md_len = 0;
    var frame_space, frame_used, frame_free;
    var /* Mad.Error */ error;
    var result = 0;

    /* allocate Layer III dynamic structures */
    nch = header.nchannels();
    si_len = (header.flags & Mad.Flag.LSF_EXT) ?
        (nch == 1 ? 9 : 17) : (nch == 1 ? 17 : 32);

    /* check frame sanity */
    if (stream.next_frame - stream.ptr.nextbyte() < si_len) {
        stream.error = Mad.Error.BADFRAMELEN;
        stream.md_len = 0;
        return -1;
    }

    /* check CRC word */
    if (header.flags & Mad.Flag.PROTECTION) {
        header.crc_check = mad_bit_crc(stream.ptr, si_len * CHAR_BIT, header.crc_check);

        if (header.crc_check != header.crc_target &&
        !(frame.options & Mad.Option.IGNORECRC)) {
          stream.error = Mad.Error.BADCRC;
          result = -1;
        }
    }

    /* decode frame side information */
    var sideinfoResult = Mad.III_sideinfo(stream.ptr, nch, header.flags & Mad.Flag.LSF_EXT);
    
    stream.ptr = sideinfoResult.ptr;
    var si = sideinfoResult.si;
    var data_bitlen = sideinfoResult.data_bitlen;
    var priv_bitlen = sideinfoResult.priv_bitlen;
    
    console.log("We're at " + stream.ptr.offset + ", data_bitlen = " + data_bitlen + ", priv_bitlen = " + priv_bitlen);
    
    if (error && result == 0) {
        stream.error = error;
        result = -1;
    }

    header.flags        |= priv_bitlen;
    header.private_bits |= si.private_bits;

    /* find main_data of next frame */
    {
        var peek = new Mad.Bit(stream.data, stream.next_frame);

        header = peek.read(32);
        
        if (Mad.bitwiseAnd(header, 0xffe60000) /* syncword | layer */ == 0xffe20000) { 
            if (!(Mad.bitwiseAnd(header, 0x00010000)))  /* protection_bit */
                peek.skip(16);  /* crc_check */

            next_md_begin = peek.read(Mad.bitwiseAnd(header, 0x00080000) /* ID */ ? 9 : 8);
        }
    }

    /* find main_data of this frame */
    frame_space = stream.next_frame - stream.ptr.nextbyte();

    //console.log("next_frame = " + stream.next_frame + ", nextbyte = " + stream.ptr.nextbyte() + ", frame_space = " + frame_space);

    //console.log("before, next_md_begin = " + next_md_begin);

    if (next_md_begin > si.main_data_begin + frame_space)
        next_md_begin = 0;

    //console.log("so far, md_len = " + md_len + ", si.main_data_begin = " + si.main_data_begin + ", frame_space = " + frame_space + ", next_md_begin = " + next_md_begin);
    
    md_len = si.main_data_begin + frame_space - next_md_begin;

    frame_used = 0;

    if (si.main_data_begin == 0) {
        ptr = stream.ptr;
        stream.md_len = 0;

        frame_used = md_len;
    } else {
        //console.log("si.main_data_begin = " + si.main_data_begin + ", stream.md_len = " + stream.md_len);
        if (si.main_data_begin > stream.md_len) {
            if (result == 0) {
                stream.error = Mad.Error.BADDATAPTR;
                result = -1;
            }
        } else {
            if (md_len > si.main_data_begin) {
                if(!(stream.md_len + md_len - si.main_data_begin <= Mad.BUFFER_MDLEN)) {
                    throw new Error("Assertion failed: (stream.md_len + md_len - si.main_data_begin <= MAD_BUFFER_MDLEN)");
                }
            
                frame_used = md_len - si.main_data_begin;
                
                /* memcpy(dst, dstOffset, src, srcOffset, length) - returns a copy of dst with modified bytes */
                stream.main_data = Mad.memcpy(stream.main_data, stream.md_len, stream.data, stream.ptr.nextbyte(), frame_used);
                
                /*
                // Keeping this here as a handy little reference
                memcpy(*stream.main_data + stream.md_len,
                    mad_bit_nextbyte(&stream.ptr),
                    frame_used = md_len - si.main_data_begin
                );
                */
                stream.md_len += frame_used;
            }
            
            var ptr = new Mad.Bit(stream.main_data, stream.md_len - si.main_data_begin);
        }
    }

    frame_free = frame_space - frame_used;

    /* decode main_data */
    if (result == 0) {
        //error = Mad.III_decode(&ptr, frame, &si, nch);
        
        if (error) {
          stream.error = error;
          result = -1;
        }
        
        /* designate ancillary bits */
        stream.anc_ptr    = ptr;
        stream.anc_bitlen = md_len * CHAR_BIT - data_bitlen;
    }
  
    // DEBUG
    console.log(
      "main_data_begin:" + si.main_data_begin +
      ", md_len:" + md_len +
      ", frame_free:" + frame_free +
      ", data_bitlen:" + data_bitlen +
      ", anc_bitlen: " + stream.anc_bitlen);

    /* preload main_data buffer with up to 511 bytes for next frame(s) */
    if (frame_free >= next_md_begin) {
        stream.main_data = Mad.memcpy(stream.main_data, 0, stream.data, stream.next_frame - next_md_begin, next_md_begin);
        /*
        // Keeping here for reference
        memcpy(*stream.main_data, stream.next_frame - next_md_begin, next_md_begin);
        */
        stream.md_len = next_md_begin;
    } else {
        if (md_len < si.main_data_begin) {
            var extra = si.main_data_begin - md_len;
            if (extra + frame_free > next_md_begin)
                extra = next_md_begin - frame_free;

            if (extra < stream.md_len) {
                stream.main_data = Mad.memcpy(stream.main_data, 0, stream.main_data, stream.md_len - extra, extra);
                /*
                // Keeping here for reference
                memmove(*stream.main_data, *stream.main_data + stream.md_len - extra, extra);
                */
                stream.md_len = extra;
            }
        } else {
            stream.md_len = 0;
        }

        stream.main_data = Mad.memcpy(stream.main_data, stream.md_len, stream.data, stream.next_frame - frame_free, frame_free);
        /*
        // Keeping here for reference
        memcpy(*stream.main_data + stream.md_len, stream.next_frame - frame_free, frame_free);
        */
        stream.md_len += frame_free;
    }

    return result;
}
