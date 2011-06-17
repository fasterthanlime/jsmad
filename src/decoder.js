
Mad.Decoder = function (data, input_func, header_func, filter_func, output_func, error_func, message_func) {
    this.mode           = -1;

    this.options        = 0;

    // async variables left out

    this.sync           = 0;

    this.cb_data        = data;

    this.input_func     = input_func;
    this.header_func    = header_func;
    this.filter_func    = filter_func;
    this.output_func    = output_func;
    this.error_func     = error_func;
    this.message_func = message_func;
};


Mad.Decoder.prototype.finish = function () {
    // this had a codepath for handling the async mode of libmad,
    // which we don't support anyway, so screw it.
    return 0;
}

// again, lots of async functions are missing here: no surprise, it's
// for actually reading data from pipes, including the Mad.Flow.CONTINUE,
// Mad.Flow.BREAK, etc. Afaik we don't have pipes in Javascripts :) We
// might have sockets but is streaming decoded data over a socket a good
// idea anyway? Also, the browser would probably not allow to listen to
// a port. And streaming decode data can be done in sync mode anyway.

Mad.Decoder.prototype.error_default = function (data, stream, frame) {
    var bad_last_frame = data;

    switch (stream.error) {
    case Mad.Error.BADCRC:
        if (bad_last_frame)
            mad_frame_mute(frame);
        else
            bad_last_frame = 1;

        return Mad.Flow.IGNORE;

    default:
        return Mad.Flow.CONTINUE;
    }
}

Mad.Decoder.run_sync () {
    var error_func; // callback, returns a mad_flow, takes a stream and a frame.
    var error_data; // pointer to a bad frame, in case of eror
    var bad_last_frame = 0; // used when no custom error func is set. wtf?
    var stream;
    var frame;
    var synth;
    var result = 0;

    if (typeof(this.input_func) == "undefined")
        return 0; // no input = no cake.

    if (typeof(this.error_func) != "undefined") {
        error_func = this.error_func;
        error_data = this.cb_data;
    } else { // double-negatives ftw
        error_func = error_default;
        error_data = null; // used to be &bad_last_frame, but meh.
    }

    this.sync.stream = Mad.Stream.new();
    this.sync.frame  = Mad.Frame.new();
    this.sync.synth  = Mad.Synth.new();

    stream   = this.sync.stream;
    frame    = this.sync.frame;
    synth    = this.sync.synth;

    // TODO: options are, like, not implemented yet. see stream.js
    //this.options = Mad.Stream.options(stream);

    do {
        // input_func should fill the Uint8Array cb_data with, well, bytes of input. 
        switch (this.input_func(this.cb_data, stream)) {
        case Mad.Flow.STOP:
            goto done;
        case Mad.Flow.BREAK:
            goto fail;
        case Mad.Flow.IGNORE:
            continue;
        case Mad.Flow.CONTINUE:
            break;
        }

        while (true) {
            if (this.header_func) {
                frame.header = Mad.Header.decode(stream);
                if (frame.header == null) {
                    if (!Mad.recoverable(stream.error))
                        break;

                    switch (error_func(error_data, stream, frame)) {
                    case Mad.Flow.STOP:
                        goto done;
                    case Mad.Flow.BREAK:
                        goto fail;
                    case Mad.Flow.IGNORE:
                    case Mad.Flow.CONTINUE:
                    default:
                        continue;
                    }
	}

	switch (this.header_func(this.cb_data, &frame.header)) {
	case Mad.Flow.STOP:
	    goto done;
	case Mad.Flow.BREAK:
	    goto fail;
	case Mad.Flow.IGNORE:
	    continue;
	case Mad.Flow.CONTINUE:
	    break;
	}
            }

            if (mad_frame_decode(frame, stream) == -1) {
	if (!MAD_RECOVERABLE(stream.error))
	    break;

	switch (error_func(error_data, stream, frame)) {
	case Mad.Flow.STOP:
	    goto done;
	case Mad.Flow.BREAK:
	    goto fail;
	case Mad.Flow.IGNORE:
	    break;
	case Mad.Flow.CONTINUE:
	default:
	    continue;
	}
            }
            else
	bad_last_frame = 0;

            if (this.filter_func) {
	switch (this.filter_func(this.cb_data, stream, frame)) {
	case Mad.Flow.STOP:
	    goto done;
	case Mad.Flow.BREAK:
	    goto fail;
	case Mad.Flow.IGNORE:
	    continue;
	case Mad.Flow.CONTINUE:
	    break;
	}
            }

            mad_synth_frame(synth, frame);

            if (this.output_func) {
	switch (this.output_func(this.cb_data,
				         &frame.header, &synth.pcm)) {
	case Mad.Flow.STOP:
	    goto done;
	case Mad.Flow.BREAK:
	    goto fail;
	case Mad.Flow.IGNORE:
	case Mad.Flow.CONTINUE:
	    break;
	}
            }
        }
    }
    while (stream.error == MAD_ERROR_BUFLEN);

 fail:
    result = -1;

 done:
    mad_synth_finish(synth);
    mad_frame_finish(frame);
    mad_stream_finish(stream);

    return result;
}

// run_async has been left out here. Don't feel like piping today! (see above for explanations)

/*
 * NAME:	decoder.run()
 * DESCRIPTION:	run the decoder thread either synchronously or asynchronousl
 * (actually only synchronously in jsmad)
 */
Mad.Decoder.prototype.run = function (mode) {
    var result;
    var run = null;

    switch (decoder.mode = mode) {
    case Mad.Decoder.Mode.SYNC:
        run = run_sync;
        break;

    case Mad.Decoder.Mode.ASYNC:
        console.log("ASYNC mode is not supported (and actually meaningless) in jsmad. Use SYNC mode :)");
        break;
    }

    if (run == null)
        return -1;

    // wtf?
    decoder.sync = malloc(sizeof(*decoder.sync));
    if (decoder.sync == 0)
        return -1;

    var result = run(decoder);

    return result;
}

// mad_decoder_message is left out, here
