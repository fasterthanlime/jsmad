function pad(length, sym, str) {
    while (str.length < length) str = sym + str;
    return str;
}

function onProgress(current, total) {
    //console.log("current = " + current + " / " + total);

    var slider = document.getElementById('progressbar');
    slider.style.width = (current / total * 360) + 'px';
}

function readFile() {
    var track_id = document.getElementById('idChooser').value;

    var url = "http://sandbox.official.fm/jsmad-proxy/?id=" + track_id;

    console.log("url = " + url);
    if (!url) {
        return;
    }

    Mad.Player.fromURL(url, function (player) {
        if (player.id3) {
            var id3 = player.id3.toHash();
            var id3element = document.getElementById('ID3');

            id3string = "<p><strong>Title:</strong> " + id3['Title/Songname/Content description'] + "</p>";
            id3string += "<p><strong>Track:</strong> " + id3['Track number/Position in set'] + "</p>";
            id3string += "<p><strong>Artist:</strong> " + id3['Lead artist/Lead performer/Soloist/Performing group'] + "</p>";
            id3string += "<p><strong>Album:</strong> " + id3['Album/Movie/Show title'] + "</p>";
            id3string += "<p><strong>Year:</strong> " + id3['Year'] + "</p>";

            var pictures = id3['Attached picture'];

            if (pictures) {
                var mime = pictures[0].mime;
                var enc = btoa(pictures[0].value);
                id3string += "<img alt='cover' src='data:" + mime + ';base64,' + enc + "'></img>";
            }

            id3element.innerHTML = id3string;
            
            document.getElementById('playpause').onclick = function () {
				player.playing = !player.playing;
				this.value = player.playing ? "pause" : "play ";
			};
        }

        player.onProgress = onProgress;

        player.createDevice();
    });

    return false;
}
