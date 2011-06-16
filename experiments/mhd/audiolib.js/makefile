MINIFY := yui-compressor

all:
	mkdir lib -p
	cat js/wrapper-start.js js/*/* js/wrapper-end.js > lib/audiolib.js
	${MINIFY} lib/audiolib.js -o lib/audiolib.min.js
