
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
  { l: sfb_32000_long, s: sfb_32000_short, m: sfb_32000_mixed } /*, // fuck MPEG 2.5
  { l: sfb_24000_long, s: sfb_24000_short, m: sfb_24000_mixed },
  { l: sfb_22050_long, s: sfb_22050_short, m: sfb_22050_mixed },
  { l: sfb_16000_long, s: sfb_16000_short, m: sfb_16000_mixed },
  { l: sfb_12000_long, s: sfb_12000_short, m: sfb_12000_mixed },
  { l: sfb_11025_long, s: sfb_11025_short, m: sfb_11025_mixed },
  { l:  sfb_8000_long, s:  sfb_8000_short, m:  sfb_8000_mixed }*/
];

Mad.count1table_select = 0x01;
Mad.scalefac_scale     = 0x02;
Mad.preflag	           = 0x04;
Mad.mixed_block_flag   = 0x08;

Mad.I_STEREO  = 0x1;
Mad.MS_STEREO = 0x2;

Mad.SideInfo = function() {
    this.gr = []; // array of Mad.Granule
    this.scfsi = []; // array of ints
};

/*
 * scalefactor bit lengths
 * derived from section 2.4.2.7 of ISO/IEC 11172-3
 */
var sflen_table = [
  { slen1: 0, slen2: 0 }, { slen1: 0, slen2: 1 }, { slen1: 0, slen2: 2 }, { slen1: 0, slen2: 3 },
  { slen1: 3, slen2: 0 }, { slen1: 1, slen2: 1 }, { slen1: 1, slen2: 2 }, { slen1: 1, slen2: 3 },
  { slen1: 2, slen2: 1 }, { slen1: 2, slen2: 2 }, { slen1: 2, slen2: 3 }, { slen1: 3, slen2: 1 },
  { slen1: 3, slen2: 2 }, { slen1: 3, slen2: 3 }, { slen1: 4, slen2: 2 }, { slen1: 4, slen2: 3 }    
];

Mad.Granule = function() {
    this.ch = []; // list of Mad.Channel    
}

Mad.Channel = function() {
    this.table_select = []; // list of Numbers (I guess)
    this.scalefac = []; // list of integers
}


/* we must take care that sz >= bits and sz < sizeof(long) lest bits == 0 */
Mad.MASK = function (cache, sz, bits) {
    return (((cache) >> ((sz) - (bits))) & ((1 << (bits)) - 1));
}
    
Mad.MASK1BIT = function (cache, sz) {
    return ((cache) & (1 << ((sz) - 1)));
}

/*
 * NAME:	III_huffdecode()
 * DESCRIPTION:	decode Huffman code words of one channel of one granule
 */
Mad.III_huffdecode = function(ptr, xr /* Float64Array(576) */, channel, sfbwidth, part2_length) {
    var exponents = new Int32Array(new ArrayBuffer(4 * 39));
    var expptr = 0;
    var peek;
    var bits_left, cachesz;
    var xrptr;
    var sfbound;
    var bitcache;
    var sfbwidthptr = 0;
    
    bits_left = channel.part2_3_length - part2_length;
    if (bits_left < 0)
        return Mad.Error.BADPART3LEN;

    Mad.III_exponents(channel, sfbwidth, exponents);

    peek = ptr;
    ptr.skip(bits_left);

    /* align bit reads to byte boundaries */
    cachesz  = peek.left;
    cachesz += ((32 - 1 - 24) + (24 - cachesz)) & ~7;

    bitcache   = peek.read(cachesz);
    bits_left -= cachesz;

    xrptr = 0;

    /* big_values */
    {
        var region = 0, rcount;
        
        var reqcache = new Float64Array(new ArrayBuffer(8 * 16));

        sfbound = xrptr + sfbwidth[sfbwidthptr++];
        rcount  = channel.region0_count + 1;

        var entry = mad_huff_pair_table[channel.table_select[region]];
        var table     = entry.table;
        var linbits   = entry.linbits;
        var startbits = entry.startbits;

        if (typeof(table) == 'undefined')
            return Mad.Error.BADHUFFTABLE;

        expptr = 0;
        exp     = exponents[expptr++];
        var reqhits = 0;
        var big_values = channel.big_values;

        while (big_values-- && cachesz + bits_left > 0) {
            var pair;
            var clumpsz, value;
            var requantized;

            if (xrptr == sfbound) {
                sfbound += sfbwidth[sfbwidthptr++];

                /* change table if region boundary */
                if (--rcount == 0) {
                    if (region == 0)
                        rcount = channel.region1_count + 1;
                    else
                        rcount = 0;  /* all remaining */

                    entry     = mad_huff_pair_table[channel.table_select[++region]];
                    table     = entry.table;
                    linbits   = entry.linbits;
                    startbits = entry.startbits;

                    if (typeof(table) == 'undefined')
                        return Mad.Error.BADHUFFTABLE;
                }

                if (exp != exponents[expptr]) {
                    exp = exponents[expptr];
                    reqhits = 0;
                }

                ++expptr;
            }

            if (cachesz < 21) {
                var bits       = ((32 - 1 - 21) + (21 - cachesz)) & ~7;
                bitcache   = (bitcache << bits) | peek.read(bits);
                cachesz   += bits;
                bits_left -= bits;
            }

            /* hcod (0..19) */
            clumpsz = startbits;
            pair    = table[Mad.MASK(bitcache, cachesz, clumpsz)];

            while (!pair.final) {
                cachesz -= clumpsz;

                clumpsz = pair.ptr.bits;
                pair    = table[pair.ptr.offset + Mad.MASK(bitcache, cachesz, clumpsz)];
            }

            cachesz -= pair.value.hlen;

            if (linbits) {
                /* x (0..14) */
                value = pair.value.x;
                var x_final = false;

                switch (value) {
                    case 0:
                      xr[xrptr] = 0;
                      break;

                    case 15:
                      if (cachesz < linbits + 2) {
                        bitcache   = (bitcache << 16) | peek.read(16);
                        cachesz   += 16;
                        bits_left -= 16;
                      }

                      value += Mad.MASK(bitcache, cachesz, linbits);
                      cachesz -= linbits;

                      requantized = Mad.III_requantize(value, exp);
                      x_final = true; // simulating goto, yay
                      break;

                    default:
                      if (reqhits & (1 << value))
                        requantized = reqcache[value];
                      else {
                        reqhits |= (1 << value);
                        requantized = reqcache[value] = Mad.III_requantize(value, exp);
                      }
                      x_final = true;
                }
                
                if(x_final) {
                      xr[xrptr] = Mad.MASK1BIT(bitcache, cachesz--) ?
                        -requantized : requantized;
                }

                /* y (0..14) */
                value = pair.value.y;

                switch (value) {
                    case 0:
                        xr[xrptr + 1] = 0;
                        break;

                    case 15:
                        if (cachesz < linbits + 1) {
                            bitcache   = (bitcache << 16) | peek.read(16);
                            cachesz   += 16;
                            bits_left -= 16;
                        }

                        value += Mad.MASK(bitcache, cachesz, linbits);
                        cachesz -= linbits;

                        requantized = Mad.III_requantize(value, exp);
                        y_final = true;
                        break; // simulating goto, yayzor

                    default:
                        if (reqhits & (1 << value))
                            requantized = reqcache[value];
                        else {
                            reqhits |= (1 << value);
                            reqcache[value] = Mad.III_requantize(value, exp);
                            requantized = reqcache[value];
                        }
                        y_final = true;
                }
                
                if(y_final) {
                  xr[xrptr + 1] = Mad.MASK1BIT(bitcache, cachesz--) ?
                    -requantized : requantized;
                }
      } else {
            /* x (0..1) */
            value = pair.value.x;

            if (value == 0) {
                xr[xrptr] = 0;
            } else {
                if (reqhits & (1 << value))
                    requantized = reqcache[value];
                else {
                    reqhits |= (1 << value);
                    requantized = reqcache[value] = Mad.III_requantize(value, exp);
                }

                xr[xrptr] = Mad.MASK1BIT(bitcache, cachesz--) ?
                    -requantized : requantized;
            }

            /* y (0..1) */
            value = pair.value.y;

            if (value == 0)
                xr[xrptr + 1] = 0;
            else {
                if (reqhits & (1 << value))
                    requantized = reqcache[value];
                else {
                    reqhits |= (1 << value);
                    requantized = reqcache[value] = III_requantize(value, exp);
                }

                xr[xrptr + 1] = Mad.MASK1BIT(bitcache, cachesz--) ?
                    -requantized : requantized;
            }
      }

      xrptr += 2;
    }
  }

  if (cachesz + bits_left < 0)
    return Mad.Error.BADHUFFDATA;  /* big_values overrun */

  /* count1 */
  {
    var table = mad_huff_quad_table[channel.flags & count1table_select];
    var requantized = Mad.III_requantize(1, exp);

    while (cachesz + bits_left > 0 && xrptr <= 572) {
        /* hcod (1..6) */
        if (cachesz < 10) {
            bitcache   = (bitcache << 16) | peek.read(16);
            cachesz   += 16;
            bits_left -= 16;
        }
    
        var quad = table[Mad.MASK(bitcache, cachesz, 4)];

        /* quad tables guaranteed to have at most one extra lookup */
        if (!quad.final) {
            cachesz -= 4;

            quad = table[quad.ptr.offset +
		      Mad.MASK(bitcache, cachesz, quad.ptr.bits)];
        }

        cachesz -= quad.value.hlen;

        if (xrptr == sfbound) {
            sfbound += sfbwidth[sfbwidthptr++];

	if (exp != exponents[expptr]) {
	  exp = exponents[expptr];
	  requantized = Mad.III_requantize(1, exp);
	}

	++expptr;
      }

      /* v (0..1) */
      xr[xrptr] = quad.value.v ?
	(Mad.MASK1BIT(bitcache, cachesz--) ? -requantized : requantized) : 0;

      /* w (0..1) */
      xr[xrptr + 1] = quad.value.w ?
	(Mad.MASK1BIT(bitcache, cachesz--) ? -requantized : requantized) : 0;

      xrptr += 2;

      if (xrptr == sfbound) {
        sfbound += sfbwidth[sfbwidthptr++];

        if (exp != exponents[expptr]) {
          exp = exponents[expptr];
          requantized = Mad.III_requantize(1, exp);
        }

        ++expptr;
      }

      /* x (0..1) */
      xr[xrptr] = quad.value.x ?
	(Mad.MASK1BIT(bitcache, cachesz--) ? -requantized : requantized) : 0;

      /* y (0..1) */
      xr[xrptr + 1] = quad.value.y ?
	(Mad.MASK1BIT(bitcache, cachesz--) ? -requantized : requantized) : 0;

      xrptr += 2;
    }

    if (cachesz + bits_left < 0) {
//# if 0 && defined(DEBUG)
      console.log("huffman count1 overrun (" + (-(cachesz + bits_left)) + " bits)");
//# endif

      /* technically the bitstream is misformatted, but apparently
	 some encoders are just a bit sloppy with stuffing bits */
      xrptr -= 4;
    }
  }

  if (!(-bits_left <= MAD_BUFFER_GUARD * CHAR_BIT)) {
      throw new Error("assertion failed: (-bits_left <= MAD_BUFFER_GUARD * CHAR_BIT)");
  }

//# if 0 && defined(DEBUG)
  if (bits_left < 0)
    console.log("read " + (-bits_left) + " bits too many");
  else if (cachesz + bits_left > 0)
    console.log((cachesz + bits_left) + " stuffing bits");
//# endif

  /* rzero */
  while (xrptr < 576) {
    xr[xrptr]     = 0;
    xr[xrptr + 1] = 0;

    xrptr += 2;
  }

  return Mad.Error.NONE;
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
 * NAME:	III_scalefactors()
 * DESCRIPTION:	decode channel scalefactors of one granule from a bitstream
 */
Mad.III_scalefactors = function (ptr, channel, gr0ch, scfsi) {
  var start; /* Mad.Bit */
  var slen1, slen2, sfbi;

  var start = ptr;

  var slen1 = sflen_table[channel.scalefac_compress].slen1;
  var slen2 = sflen_table[channel.scalefac_compress].slen2;

  if (channel.block_type == 2) {
    sfbi = 0;

    var nsfb = (channel.flags & mixed_block_flag) ? 8 + 3 * 3 : 6 * 3;
    while (nsfb--)
      channel.scalefac[sfbi++] = ptr.read(slen1);

    nsfb = 6 * 3;
    while (nsfb--)
      channel.scalefac[sfbi++] = ptr.read(slen2);

    nsfb = 1 * 3;
    while (nsfb--)
      channel.scalefac[sfbi++] = 0;
  }
  else {  /* channel.block_type != 2 */
    if (scfsi & 0x8) {
      for (sfbi = 0; sfbi < 6; ++sfbi)
	channel.scalefac[sfbi] = gr0ch.scalefac[sfbi];
    }
    else {
      for (sfbi = 0; sfbi < 6; ++sfbi)
	channel.scalefac[sfbi] = ptr.read(slen1);
    }

    if (scfsi & 0x4) {
      for (sfbi = 6; sfbi < 11; ++sfbi)
	channel.scalefac[sfbi] = gr0ch.scalefac[sfbi];
    }
    else {
      for (sfbi = 6; sfbi < 11; ++sfbi)
	channel.scalefac[sfbi] = ptr.read(slen1);
    }

    if (scfsi & 0x2) {
      for (sfbi = 11; sfbi < 16; ++sfbi)
	channel.scalefac[sfbi] = gr0ch.scalefac[sfbi];
    }
    else {
      for (sfbi = 11; sfbi < 16; ++sfbi)
	channel.scalefac[sfbi] = ptr.read(slen2);
    }

    if (scfsi & 0x1) {
      for (sfbi = 16; sfbi < 21; ++sfbi)
	channel.scalefac[sfbi] = gr0ch.scalefac[sfbi];
    }
    else {
      for (sfbi = 16; sfbi < 21; ++sfbi)
	channel.scalefac[sfbi] = ptr.read(slen2);
    }

    channel.scalefac[21] = 0;
  }

  return ptr.length(start);
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
    var scalefac_multiplier = (channel.flags & Mad.scalefac_scale) ? 2 : 1;
    
    if (channel.block_type == 2) {
        var sfbi = 0, l = 0;
        
        if (channel.flags & mixed_block_flag) {
            var premask = (channel.flags & Mad.preflag) ? ~0 : 0;
            
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
    } else { /* channel.block_type != 2 */
        if (channel.flags & Mad.preflag) {
            for (var sfbi = 0; sfbi < 22; ++sfbi) {
                exponents[sfbi] = gain - ((channel.scalefac[sfbi] + pretab[sfbi]) << scalefac_multiplier);
            }
        } else {
            for (var sfbi = 0; sfbi < 22; ++sfbi) {
                exponents[sfbi] = gain - (channel.scalefac[sfbi] << scalefac_multiplier);
            }
        }
    }
}

Mad.III_requantize = function(value, exp) {
    var frac = exp % 4;
    
    exp /= 4;
    
    power = result;
    
    power = rq_table[value];
    requantized = power.mantissa;
    exp += power.exponent;
    
    if (exp < 0) {
        if (-exp >= sizeof(mad_fixed_t) * CHAR_BIT) {
            requantized = 0;
        } else {
            requantized += 1 << (-exp - 1);
            requantized >>= -exp;
        }
    } else {
        if (exp >= 5) {
            requntized = MAD_F_MAX;
        } else {
            requntized <<= exp;
        }
    }
    
    return frac ? requantized * root_table[3 + frac] : requantized;
}
