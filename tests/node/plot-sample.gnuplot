set terminal png
set output 'sample.png'
plot "sample-js.txt" title 'jsmad' with lines, "sample.txt" title 'libmad' with lines
