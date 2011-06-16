var	audioLib	= require('audiolib'),
	fs		= require('fs'),
	dev, osc, rec, path;

function audioProcess(buffer, ch){
	var	l	= buffer.length,
		smpl,
		i, n;
	for (i=0; i<l; i+=ch){
		osc.generate();
		smpl = osc.getMix();
		for (n=0; n<ch; n++){
			buffer[i + n] = smpl;
		}
	}
}

dev	= new audioLib.AudioDevice.devices.dummy(audioProcess, 2);
osc	= new audioLib.Oscillator(dev.sampleRate, 440);
rec	= dev.record();
path	= process.argv[2] || 'test.wav';

setTimeout(function(){
	rec.stop();
	dev.kill();
	var	data	= rec.toWav();
	fs.writeFileSync(path, data, 'binary');
	process.exit();
}, 5000);
