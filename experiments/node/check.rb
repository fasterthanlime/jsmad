Dir.chdir("../../../libmad") do
  system("make minimad && ./minimad < one_second_beep.mp3 > ../jsmad/experiments/node/libmad.txt")
end

system("node test.js > jsmad.txt")

libmad = File.readlines("libmad.txt")
jsmad = File.readlines("jsmad.txt")

libmad.zip(jsmad) do |a, b|
  a.split("\t").zip(b.split("\t")) do |x, y|
    diff = (x.to_f - y.to_f).abs
    if diff > 1.0e-5
      puts diff
    end
  end
end
