## About

jsmad is a pure javascript MP3 decoder, based on [libmad](http://www.underbit.com/products/mad/), with an ID3 decoder written from scratch.

For example, jsmad allows Firefox 4.0+ to play MP3s without any Flash. Faster loading times. Fewer security holes. No 64-bit headaches on Linux. Fewer memory leaks.

jsmad opens up a whole world of realtime audio applications implemented in javascript: 
dj-mixers, samplers, sequencers, all these applications benefit from using mp3s as audio source.  

jsmad is released under the GPLv2 license.

## Demo

See a live demo here: http://jsmad.org/ in collaboration with [official.fm](http://official.fm/) and using the [musicmetric](http://musicmetric.com/) API

It works out of the box under Firefox 4.0 and above. On Chrome 13.0+, you have to enable manually the Web Audio API in 'about:flags', then restart the browser and it should work fine! No Opera support at the moment.

## Authors

  * [@nddrylliog](http://twitter.com/nddrylliog) - lead developer
  * [@jensnockert](http://twitter.com/jensnockert) - helped porting & debugging the code at MusicHackDay Berlin
  * [@mgeorgi](http://twitter.com/mgeorgi) - helped debugging the code after MusicHackDay Berlin

Special thanks to [@antoinem](http://twitter.com/antoinem) for the Demo design and particularly to [@_romac](http://twitter.com/_romac) for adding features & keeping the demo server alive!

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
using it on a commercial platform is probably alright. Remember: no guarantees, and we'd love to know
about it!

libmad has commercial license. As for jsmad, we're in a sort of grey legal area. If you're from
Underbit and want to work this out with us please drop me a note at amos@official.fm

## Future

What's next? A few things:

  - Strings are still used in the core decoding routines instead of Uint8Arrays - this should change
  - Optimizations, always
  - Better buffering strategy - player.js is still pretty naive and we stumble now and then onto buffer underflow
  - MPEG Layer I and II are not supported, only Layer III is - it should be pretty trivial but we had no interest for it in the first place.
  - MPEG 2.5 is not supported.
  - Free bitrate streams are not supported (this is different from VBR - VBR is supported)
  - Most of ID3v2.2 and ID3v2.3 are implemented, but some tags are mising.
