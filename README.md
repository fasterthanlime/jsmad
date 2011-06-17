## About

jsmad is a pure javascript MP3 decoder.

jsmad is a pure javascript port of [libmad](http://www.underbit.com/products/mad/)

For example, jsmad allows Firefox 4.0+ to play MP3s without any Flash. Faster loading times. Less security holes. No 64-bit headaches on Linux. Less memory leaks.

jsmad is GPL-ed, fork yours today!

## Demo

See a live demo here: http://jsmad.org/ in collaboration with [official.fm](http://official.fm/) and using the [musicmetric](http://musicmetric.com/) API

It works fine under Firefox 4.0 and above, and should work under Chrome 10+ thanks to audiolib.js, although we haven't gotten it to work ourselves.

## Porting notes

Obviously, porting low-level C code to Javascript isn't an easy task. Some things had to be 
adapted pretty heavily. jsmad is not the result of an automatic translation - all 15K+ lines
of code were translated by hand by @nddrylliog and @jensnockert during MusicHackDay Berlin.
Then, @mgeorgi helped us a lot with the debugging process, and @antoinem did the design of the demo
during MusicHackDay Barcelona.

It performs well enough to decode and play MP3s in realtime on Firefox on modern computers,
although if you do lots of things at once, Firefox might forget at all about scheduled tasks
and let the soundcard underflow. There is a rescue mechanism for that in the demo, which works
most of the time.

jsmad will undoubtedly be an interesting benchmark for browser's javascript implementations.
We would love to get feedback from the Mozilla, Google Chrome, and Opera team - shoot us a note!

## Accuracy

The output from jsmad is NOT representative of the output quality of libmad itself. jsmad hasn't been
tested for ISO/IEC 11172-4 computational accuracy requirements compliance. JavaScript number crunching
has always been a bad idea, and we're aware of that - we've done it to push the limits of what is being
done with JavaScript, much in the spirit of [pdf.js](https://github.com/andreasgal/pdf.js)

## License

jsmad is available under the terms of the GNU General Public License, Version 2. Please note that
under the GPL, there is absolutely no warranty of any kind, to the extent permitted by the law.

What GPL means for a javascript library is not exactly clear to us. What's clear is that you have
to release any fork/changes under the GPL as well, so that everyone can profit from it. However,
using it on a commercial platform is pobably alright. Remember: no guarantees, and we'd love to know
about it!

libmad has commercial license. As for jsmad, we're in a sort of grey legal area. If you're from
Underbit and want to work this out with us (nddrylliog, mgeorgi, jensnockert) please drop me a note
at amos@official.fm

## Future

What's next? A few things:

  - Strings are still used in the core decoding routines instead of Uint8Arrays - this should change
  - Optimizations, always
  - Chrome 10+ support - have no idea why it doesn't work, it seems that only the audio output is broken, everything else runs fine
  - Better buffering strategy - player.js is still pretty naive and we stumble now and then onto buffer underflow
  - MPEG Layer I and II are not supported, only Layer III is - it should be pretty trivial but we had no interest for it in the first place.
  - MPEG 2.5 is not supported.
  - Free bitrate streams are not supported.
  - Most of ID3v2.2 and ID3v2.3 are implemented, but some tags are mising.

## That's all, folks!

Thanks for your time :) Hope you like jsmad.
