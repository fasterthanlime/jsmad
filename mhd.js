function onPlayPause() {
    console.log("playPause");
}

function onSeek(percentage) {
    console.log("seek " + percentage + "%");
}

function onProgress(current, total, preload) {
    //console.log("current = " + current + ", total = " + total);
    var preloadbar = document.getElementById('preloadbar');
    preloadbar.style.width = (preload * 360) + 'px';
    var progressbar = document.getElementById('progressbar');
    progressbar.style.width = (current / total * 360) + 'px';
}

var globalPlayer = null;
var ofm = new OfficialFM('Q5Bd7987TmfsNVOHP9Zt');
var ofmTrack = null;

function domReady() {
	var playOfm = function () {
		var track_id = document.getElementById('ofm').value;
		var url = "http://jsmad.org/track/" + track_id;
		ofm.track(track_id, function(track) {
			ofmTrack = track;
			Mad.Player.fromURL(url, usePlayer);
		});
		return false;
	};
	document.getElementById('ofm').onkeypress = function(ev) {
		if(ev.keyCode == 13) { // enter pressed?
			playOfm();
			return false;
		}
	};
	playOfm();
}

function usePlayer (player) {
	if(globalPlayer) globalPlayer.destroy();
	globalPlayer = player;
	if (player.id3) {
		var id3 = player.id3.toHash();
		var id3element = document.getElementById('ID3');

		var id3string = "<div class='player'><div class='picture'>";
		var pictures = id3['Attached picture'];

		if(ofmTrack) {
			id3string += "<img class='picture' src='" + ofmTrack.picture_absolute_url.replace('_small', '_large') + "' />";
		} else if (pictures) {
			var mime = pictures[0].mime;
			var enc = btoa(pictures[0].value);
			id3string += "<img class='picture' src='data:" + mime + ';base64,' + enc + "' />";
		} else {
			id3string += "<img class='picture' src='../images/nopicture.png' />";
		}

		id3string += "<a href='#' id='playpause' class='button play'></a>";
		id3string += "<div class='timeline'><div id='preloadbar'><div id='progressbar'></div></div></div>";

		id3string += "</div></div>";
		id3string += "<div class='info'>";
		
		var artist = ofmTrack? ofmTrack.artist_string: id3['Lead artist/Lead performer/Soloist/Performing group'];
		id3string += "<h2 id='track_span'>" + (ofmTrack ? ofmTrack.title : id3['Title/Songname/Content description']) + "</h2>";
		id3string += "<h3 id='artist_span'>" + artist + "</h3>";
		id3string += "<div class='meta' id='meta_info'>";
		if(id3['Album/Movie/Show title']) {
			id3string += "<p><strong>Album:</strong> " + id3['Album/Movie/Show title'] + "</p>";
		}
		if(id3['Track number/Position in set']) {
			id3string += "<p><strong>Track:</strong> " + id3['Track number/Position in set'] + "</p>";
		}
		if(id3['Year']) {
			id3string += "<p><strong>Year:</strong> " + id3['Year'] + "</p>";
		}
		id3string += "</div>";
		id3string += "</div>";
		ofmTrack = null;

		id3element.innerHTML = id3string;
	
		document.getElementById('playpause').onclick = function () {
			player.setPlaying(!player.playing);
			return false;
		};
		
		// musicbrainz + musicmetric queries
		$.ajax({
			type: "GET",
			url: "http://jsmad.org/musicbrainz/" + escape(artist),
			dataType: "xml",
			success: function(xml) {
				var doc = $(xml);
				console.log("real artist name = " + doc.find('artist').children('name').text());
				var artist_id = doc.find('artist').attr('id');
				console.log("musicbrainz artist id = " + artist_id);

				var icons = {
					facebook: 'http://facebook.com/favicon.ico',
					lastfm: 'http://last.fm/favicon.ico',
					myspace: 'http://myspace.com/favicon.ico',
					twitter: 'http://twitter.com/favicon.ico',
					youtube: 'http://www.youtube.com/favicon.ico',
				};

				$.ajax({
					type: "GET",
					url: "http://jsmad.org/musicmetric/musicbrainz:" + artist_id,
					dataType: "json",
					success: function(json) {
						console.log("success? " + json.success);
						var up_img = '<img src="http://jsmad.org/images/up.png">';
						var down_img = '<img src="http://jsmad.org/images/down.png">';
						var equal_img = '<img src="http://jsmad.org/images/equal.png">';

						for(var platform in json.response.fans) {
							if(!json.response.fans.hasOwnProperty(platform)) continue;
							if(platform == "total") continue;

							var fans = json.response.fans[platform];
							var previousFans = parseInt(fans.previous);
							var  currentFans = parseInt(fans.current);
							var    totalFans = parseInt(fans.total);
							console.log("previous/current fans? " + previousFans + "/" + currentFans);
							$('#meta_info').append('<p><strong>' + (Math.abs(currentFans - previousFans) < 5 ? equal_img : (currentFans > previousFans ? up_img : down_img)) + ' <img src="' + icons[platform] + '"> ' + platform + ': ' + (totalFans > 1000000 ? ((Math.floor(totalFans / 100000) / 10.0) + "M") : (totalFans > 1000 ? ((Math.floor(totalFans / 100) / 10.0) + "K") : totalFans)) + ' fans</strong>' + '</p>');
						}
						$('#artist_span').append(' <small>' + json.response.fans.total.total + ' fans</small>');
					}
				});
			}
		}); 
	}

	player.onProgress = onProgress;
	
	player.onPlay = function() {
		document.getElementById('playpause').className = 'button pause';
	};

	player.onPause = function() {
		document.getElementById('playpause').className = 'button play';
	};

	player.createDevice();
}

function readFile() {
    // uploadData is a form element
    // fileChooser is input element of type 'file'
    var file = document.forms['uploadData']['fileChooser'].files[0];
    if (!file) {
        return;
    }

    Mad.Player.fromFile(file, usePlayer);
}
