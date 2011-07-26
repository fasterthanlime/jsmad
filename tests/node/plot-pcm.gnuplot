set terminal png
set output 'pcm.png'
plot "pcm-js.txt" title 'jsmad' with lines, "pcm.txt" title 'libmad' with lines
