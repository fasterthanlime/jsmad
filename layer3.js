
/*
 * MPEG-1 scalefactor band widths
 * derived from Table B.8 of ISO/IEC 11172-3
 */
var sfb_48000_long = [
   4,  4,  4,  4,  4,  4,  6,  6,  6,   8,  10,
  12, 16, 18, 22, 28, 34, 40, 46, 54,  54, 192
];

var sfb_44100_long = [
   4,  4,  4,  4,  4,  4,  6,  6,  8,   8,  10,
  12, 16, 20, 24, 28, 34, 42, 50, 54,  76, 158
];

var sfb_32000_long = [
   4,  4,  4,  4,  4,  4,  6,  6,  8,  10,  12,
  16, 20, 24, 30, 38, 46, 56, 68, 84, 102,  26
];

var sfb_48000_short = [
   4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  6,
   6,  6,  6,  6,  6, 10, 10, 10, 12, 12, 12, 14, 14,
  14, 16, 16, 16, 20, 20, 20, 26, 26, 26, 66, 66, 66
];

var sfb_44100_short = [
   4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  6,
   6,  6,  8,  8,  8, 10, 10, 10, 12, 12, 12, 14, 14,
  14, 18, 18, 18, 22, 22, 22, 30, 30, 30, 56, 56, 56
];

var sfb_32000_short = [
   4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  6,
   6,  6,  8,  8,  8, 12, 12, 12, 16, 16, 16, 20, 20,
  20, 26, 26, 26, 34, 34, 34, 42, 42, 42, 12, 12, 12
];

var sfb_48000_mixed = [
  /* long */   4,  4,  4,  4,  4,  4,  6,  6,
  /* short */  4,  4,  4,  6,  6,  6,  6,  6,  6, 10,
              10, 10, 12, 12, 12, 14, 14, 14, 16, 16,
              16, 20, 20, 20, 26, 26, 26, 66, 66, 66
];

var sfb_44100_mixed = [
  /* long */   4,  4,  4,  4,  4,  4,  6,  6,
  /* short */  4,  4,  4,  6,  6,  6,  8,  8,  8, 10,
              10, 10, 12, 12, 12, 14, 14, 14, 18, 18,
              18, 22, 22, 22, 30, 30, 30, 56, 56, 56
];

var sfb_32000_mixed = [
  /* long */   4,  4,  4,  4,  4,  4,  6,  6,
  /* short */  4,  4,  4,  6,  6,  6,  8,  8,  8, 12,
              12, 12, 16, 16, 16, 20, 20, 20, 26, 26,
              26, 34, 34, 34, 42, 42, 42, 12, 12, 12
];

var sfbwidth_table = [
  { l: sfb_48000_long, s: sfb_48000_short, m: sfb_48000_mixed },
  { l: sfb_44100_long, s: sfb_44100_short, m: sfb_44100_mixed },
  { l: sfb_32000_long, s: sfb_32000_short, m: sfb_32000_mixed },
  { l: sfb_24000_long, s: sfb_24000_short, m: sfb_24000_mixed },
  { l: sfb_22050_long, s: sfb_22050_short, m: sfb_22050_mixed },
  { l: sfb_16000_long, s: sfb_16000_short, m: sfb_16000_mixed },
  { l: sfb_12000_long, s: sfb_12000_short, m: sfb_12000_mixed },
  { l: sfb_11025_long, s: sfb_11025_short, m: sfb_11025_mixed },
  { l:  sfb_8000_long, s:  sfb_8000_short, m:  sfb_8000_mixed }
];

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
 * NAME:	III_decode()
 * DESCRIPTION:	decode frame main_data
 * 
 * result struct:
 * {
 *    result,
 *    ptr,
 *    si,
 * }
 */
Mad.III_decode = function (ptr, frame, si, nch) {
    var header = frame.header;
    var sfreqi;
  
    {
        var sfreq = header.samplerate;

        if (header.flags & Mad.Flag.MPEG_2_5_EXT)
          sfreq *= 2;

        /* 48000 => 0, 44100 => 1, 32000 => 2,
           24000 => 3, 22050 => 4, 16000 => 5 */
        sfreqi = ((sfreq >>  7) & 0x000f) +
                 ((sfreq >> 15) & 0x0001) - 8;

        if (header.flags & Mad.Flag.MPEG_2_5_EXT)
          sfreqi += 3;
    }
  
    /* scalefactors, Huffman decoding, requantization */
    var ngr = (header.flags & Mad.Flag.LSF_EXT) ? 1 : 2;
  
    for (var gr = 0; gr < ngr; ++gr) {
        var granule = si.gr[gr];
        var sfbwidth = [];
        /* unsigned char const *sfbwidth[2]; */
        var xr = [ new Float64Array(new ArrayBuffer(576)), new Float64Array(new ArrayBuffer(576)) ];
        
        var error;

        for (var ch = 0; ch < nch; ++ch) {
            var channel = granule.ch[ch];
            var part2_length;

            sfbwidth[ch] = sfbwidth_table[sfreqi].l;

            if (channel.block_type == 2) {
                sfbwidth[ch] = (channel.flags & mixed_block_flag) ?
                    sfbwidth_table[sfreqi].m : sfbwidth_table[sfreqi].s;
            }

            if (header.flags & Mad.Flag.LSF_EXT) {
                part2_length = Mad.III_scalefactors_lsf(ptr, channel,
					    ch == 0 ? 0 : si.gr[1].ch[1], header.mode_extension);
            } else {
                part2_length = Mad.III_scalefactors(ptr, channel, si.gr[0].ch[ch],
					gr == 0 ? 0 : si.scfsi[ch]);
            }

            error = Mad.III_huffdecode(ptr, xr[ch], channel, sfbwidth[ch], part2_length);
            if (error)
                return error;
        }

        /* joint stereo processing */
        if (header.mode == MAD_MODE_JOINT_STEREO && header.mode_extension) {
            error = Mad.III_stereo(xr, granule, header, sfbwidth[0]);
            
            if (error)
                return error;
        }

        /* reordering, alias reduction, IMDCT, overlap-add, frequency inversion */
        for (var ch = 0; ch < nch; ++ch) {
            var channel = granule.ch[ch];
            var sample = frame.sbsample[ch][18 * gr];
        
            var sb, l = 0, i, sblimit;
            var output = new Float64Array(new ArrayBuffer(36));

            if (channel.block_type == 2) {
                Mad.III_reorder(xr[ch], channel, sfbwidth[ch]);

                /*
                 * According to ISO/IEC 11172-3, "Alias reduction is not applied for
                 * granules with block_type == 2 (short block)." However, other
                 * sources suggest alias reduction should indeed be performed on the
                 * lower two subbands of mixed blocks. Most other implementations do
                 * this, so by default we will too.
                 */
                if (channel.flags & mixed_block_flag)
                    Mad.III_aliasreduce(xr[ch], 36);
            } else {
                Mad.III_aliasreduce(xr[ch], 576);
            }

            /* subbands 0-1 */
            if (channel.block_type != 2 || (channel.flags & mixed_block_flag)) {
                var block_type = channel.block_type;
                if (channel.flags & mixed_block_flag)
                    block_type = 0;

                /* long blocks */
                for (var sb = 0; sb < 2; ++sb, l += 18) {
                    Mad.III_imdct_l(xr[ch][l], output, block_type);
                    Mad.III_overlap(output, frame.overlap[ch][sb], sample, sb);
                }
            } else {
                /* short blocks */
                for (var sb = 0; sb < 2; ++sb, l += 18) {
                    Mad.III_imdct_s(xr[ch][l], output);
                    Mad.III_overlap(output, frame.overlap[ch][sb], sample, sb);
                }
            }

            Mad.III_freqinver(sample, 1);

            /* (nonzero) subbands 2-31 */
            i = 576;
            while (i > 36 && xr[ch][i - 1] == 0)
                --i;

            sblimit = 32 - (((576 - i) / 18) << 0);

            if (channel.block_type != 2) {
                /* long blocks */
                for (var sb = 2; sb < sblimit; ++sb, l += 18) {
                    Mad.III_imdct_l(xr[ch][l], output, channel.block_type);
                    Mad.III_overlap(output, frame.overlap[ch][sb], sample, sb);

                    if (sb & 1)
                        sample = Mad.III_freqinver(sample, sb);
                }
            } else {
                /* short blocks */
                for (var sb = 2; sb < sblimit; ++sb, l += 18) {
                    Mad.III_imdct_s(xr[ch][l], output);
                    Mad.III_overlap(output, frame.overlap[ch][sb], sample, sb);

                    if (sb & 1)
                        Mad.III_freqinver(sample, sb);
                }
            }

            /* remaining (zero) subbands */
            for (var sb = sblimit; sb < 32; ++sb) {
                Mad.III_overlap_z(frame.overlap[ch][sb], sample, sb);

                if (sb & 1)
                    Mad.III_freqinver(sample, sb);
            }
        }
    }

    return Mad.Error.NONE;
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
        var result = Mad.III_decode(ptr, frame, si, nch);
        
        ptr = result.ptr;
        si = result.si;
        error = result.error;
        
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

Mad.III_exponents = function(channel, sfbwidth, exponents) {
    var gain = channel.global_gain - 210;
    var scalefac_multiplier = (channel.flags & scalefac_scale) ? 2 : 1;
    
    if (channel.block_type == 2) {
        var sfbi = 0, l = 0;
        
        if (channel.flags & mixed_block_flag) {
            var premask = (channel.flags & preflag) ? ~0 : 0;
            
            /* long block subbands 0-1 */
            
            while (l < 36) {
                exponents[sfbi] = gain - ((channel.scalefac[sfbi] + (pretab[sfbi] & premask)) << scalefac_multiplier);
                
                l += sfbwidth[sfbi++]
            }
        }
        
        /* this is probably wrong for 8000 Hz short/mixed blocks */
        
        var gain0 = gain - 8 * channel.subblock_gain[0];
        var gain1 = gain - 8 * channel.subblock_gain[1];
        var gain2 = gain - 8 * channel.subblock_gain[2];
        
        while (l < 576) {
            exponents[sfbi + 0] = gain0 - (channel.scalefac[sfbi + 0] << scalefac_multiplier);
            exponents[sfbi + 1] = gain1 - (channel.scalefac[sfbi + 1] << scalefac_multiplier);
            exponents[sfbi + 2] = gain2 - (channel.scalefac[sfbi + 2] << scalefac_multiplier);
            
            l    += 3 * sfbwidth[sfbi];
            sfbi += 3;
        }
    } else { /* channel->block_type != 2 */
        if (channel.flags & preflag) {
            for (var sfbi = 0; sfbi < 22; ++sfbi) {
                exponents[sfbi] = gain - ((channel.scalefac[sfbi] + pretab[sfbi]) << scalefac_multiplier
            }
        } else {
            for (var sfbi = 0; sfbi < 22; ++sfbi) {
                exponents[sfbi] = gain - (channel.scalefac[sfbi] << scalefac_multiplier
            }
        }
    }
}
