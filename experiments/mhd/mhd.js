
function onPlayPause() {
	console.log("playPause");	
}

function onSeek(percentage) {
	console.log("seek " + percentage + "%");
}

function onProgress(current, total) {
	console.log("current = " + current + ", total = " + total);
	var slider = document.getElementById('progressBar');
	slider.style.width = (current / total * 360) + 'px';
}

function readFile() {
    // uploadData is a form element
    // fileChooser is input element of type 'file'
    var file = document.forms['uploadData']['fileChooser'].files[0];
    
    if (!file) {
        return;
    }
    
    Mad.Player.fromFile(file, function(player) {
	  if (player.id3) {
          var id3 = player.id3.toHash();
          var id3element = document.getElementById('ID3');

          var id3string = "<div class='player'><div class='picture'>";
          var pictures = id3['Attached picture'];
          
          if (pictures) {
              var mime = pictures[0].mime;
              var enc  = btoa(pictures[0].value);
              id3string += "<img class='picture' src='data:" + mime + ';base64,' + enc + "' />";
          }

          id3string += "<a href='#' class='button play'></a>";
          id3string += "<div class='timeline'></div>";

          id3string += "</div></div>";
          id3string += "<div class='info'>";
          id3string += "<h2>" + id3['Title/Songname/Content description'] + "</h2>";
          id3string += "<h3>" + id3['Lead artist/Lead performer/Soloist/Performing group'] + "</h3>";
          id3string += "<div class='meta'>";
          id3string += "<p><strong>Album:</strong> " + id3['Album/Movie/Show title'] + "</p>";
          id3string += "<p><strong>Track:</strong> " + id3['Track number/Position in set'] + "</p>";
          id3string += "<p><strong>Year:</strong> " + id3['Year'] + "</p>";
          id3string += "</div>";
          id3string += "</div>";
          
          id3element.innerHTML = id3string;
      }
      
      player.onProgress = onProgress;
      player.createDevice();
    });
    
    return;
}
