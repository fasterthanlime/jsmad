# Dir.chdir("../../../libmad") do
#   system("make minimad && ./minimad < one_second_beep.mp3 > ../jsmad/experiments/node/libmad.txt")
# end

# system("node test.js > jsmad.txt")

libmad = File.readlines(ARGV[0])
jsmad = File.readlines(ARGV[1])

diffs = []

libmad.zip(jsmad) do |a, b|
  a.split("\t").zip(b.split("\t")) do |x, y|
    diffs << (x.to_f - y.to_f).abs
  end
end

puts diffs.max
