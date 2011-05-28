
Mad.Layer = {
    I: 1,
    II: 2,
    III: 3,
};

Mad.Mode = {
    SINGLE_CHANNEL        = 0,
    MAD_MODE_DUAL_CHANNEL = 1,		/* dual channel */
    MAD_MODE_JOINT_STEREO = 2,		/* joint (MS/intensity) stereo */
    MAD_MODE_STEREO 	  = 3		/* normal LR stereo */
};

Mad.Emphasis = {
    NONE	   = 0,		/* no emphasis */
    _50_15_US  = 1,		/* 50/15 microseconds emphasis */
    CCITT_J_17 = 3,		/* CCITT J.17 emphasis */
    RESERVED   = 2		/* unknown emphasis */
};

Mad.Header = function () {
    this.layer          = 0;			/* audio layer (1, 2, or 3) */
    this.mode           = 0;			/* channel mode (see above) */
    this.mode_extension = 0;			/* additional mode info */
    this.emphasis       = 0;		    /* de-emphasis to use (see above) */    

    this.bitrate        = 0;		    /* stream bitrate (bps) */
    this.samplerate     = 0;		    /* sampling frequency (Hz) */

    this.crc_check      = 0;		    /* frame CRC accumulator */
    this.crc_target     = 0;		    /* final target CRC checksum */

    this.flags          = 0;			/* flags (see below) */
    this.private_bits   = 0;			/* private bits (see below) */

    //this.duration       = mad_timer_zero;			/* audio playing time of frame */
};

Mad.Header.nchannels = function () {
    return this.mode == 0 ? 1 : 2;
}

Mad.Header.nbsamples = {
    return (this.layer == Mad.Layer.I ? 12 : 
        ((this.layer == Mad.Layer.III && (this.flags & Mad.Flag.LSF_EXT)) ? 18 : 16));
}

Mad.Frame = function () {
    this.header = new Mad.Header();     /* MPEG audio header */
    
    this.options = 0;				    /* decoding options (from stream) */

    this.sbsample = new ArrayBuffer(2 * 36 * 32);	/* synthesis subband filter samples */
    this.overlap  = new ArrayBuffer(2 * 32 * 18);	/* Layer III block overlap data */
};

Mad.sbsampleIndex = function (i, j, k) {
    return i * 36 * 32 + j * 32 + k;
}

Mad.overlapIndex = function (i, j, k) {
    return i * 32 * 18 + j * 18 + k;
}

Mad.Flag = {
    MAD_FLAG_NPRIVATE_III	: 0x0007,	/* number of Layer III private bits */
    MAD_FLAG_INCOMPLETE	: 0x0008,	/* header but not data is decoded */

    MAD_FLAG_PROTECTION	: 0x0010,	/* frame has CRC protection */
    MAD_FLAG_COPYRIGHT	: 0x0020,	/* frame is copyright */
    MAD_FLAG_ORIGINAL	: 0x0040,	/* frame is original (else copy) */
    MAD_FLAG_PADDING	: 0x0080,	/* frame has additional slot */

    MAD_FLAG_I_STEREO	: 0x0100,	/* uses intensity joint stereo */
    MAD_FLAG_MS_STEREO	: 0x0200,	/* uses middle/side joint stereo */
    MAD_FLAG_FREEFORMAT	: 0x0400,	/* uses free format bitrate */

    MAD_FLAG_LSF_EXT	: 0x1000,	/* lower sampling freq. extension */
    MAD_FLAG_MC_EXT	: 0x2000,	/* multichannel audio extension */
    MAD_FLAG_MPEG_2_5_EXT	: 0x4000	/* MPEG 2.5 (unofficial) extension */
};

Mad.Private = {
    HEADER	: 0x0100,	/* header private bit */
    III	: 0x001f	/* Layer III private bits (up to 5) */
};
