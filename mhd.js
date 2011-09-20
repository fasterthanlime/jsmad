
( function()
{
    
    var DEBUG = window.MHD_DEBUG || false;
    
    window.MHD = function( o )
    {
        this.options  = o;
        this.ofm      = new OfficialFM( o.ofmAPIKey );
        this.player   = null;
        this.ofmTrack = null;
        
        // var globalPlayer = null;
        // var ofm = new OfficialFM('Q5Bd7987TmfsNVOHP9Zt');
        // var ofmTrack = null;
    };
    
    MHD.MP3_URL = 'http://mp3.jsmad.org';
    
    MHD.prototype = {
        
        bindEvents : ( function()
        {
            var eventsBinded = false;
            
            return function()
            {
                if(eventsBinded) return;
                
                var self = this;
                
                this.el = {};
                
                for(key in this.options.el)
                {
                    this.el[key] = document.querySelector(this.options.el[key]);
                }
                
                this.el.fileChooser.onchange = function( ev )
                {
                    self.readFile( ev );
                };
                
                this.el.trackId.onkeypress = function(ev)
                {
                    // enter pressed ?
                    if(ev.keyCode == 13) {
                        
                        self.playOfm();
                        return false;
                    }
                };
            };
            
        } )(),
        
        onPageLoad : function()
        {
            this.bindEvents();
            this.checkLocation();
            this.playOfm();
        },
        
        onPlayPause : function()
        {
            DEBUG && console.log("play/paused pressed.");
        },
        
        onSeek : function(percentage)
        {
            DEBUG && console.log("seek " + percentage + "%");
        },
        
        onProgress: function( current, total, preload )
        {
            DEBUG && console.log("current = " + current + ", total = " + total);
            
            this.el.preloadBar.style.width  = (preload * 360) + 'px';
            this.el.progressBar.style.width = (current / total * 360) + 'px';
        },
        
        checkLocation: function()
        {
            this.location = window.location;
            
            var match = /^\/play\/(\d+)\/?/.exec( this.location.pathname );
            match && ( this.el.trackId.value = match[ 1 ] );
        },
        
        playOfm : function()
        {
            var trackId = this.el.trackId.value,
                url     = MHD.MP3_URL + "/mp3s/" + Math.floor( trackId / 1000 ) + "/" + trackId + ".mp3",
                self    = this;
            
            this.el.playUrl.value = this.location.protocol + '//' + this.location.host + '/play/' + trackId;
            
            this.ofm.track( trackId, function( track )
            {
                self.ofmTrack = track;
                Mad.Player.fromURL( url, function( player )
                {
                    self.usePlayer( player );
                } );
            } );
        },
        
        readFile : function()
        {
            // uploadData is a form element
            // fileChooser is input element of type 'file'
            var file = document.forms['uploadData']['fileChooser'].files[0],
                self = this;
            
            if (!file) return;
            
            Mad.Player.fromFile(file, function( player )
            {
                self.usePlayer( player );
            });
        },
        
        // TODO: Refactor this method.
        usePlayer : function(player)
        {
            var self = this;
            
            if(this.player) player.destroy();
            
            this.player = player;
            
            if (player.id3) {
                
                var id3        = player.id3.toHash(),
                    id3element = self.el.id3,
                    id3string  = "<div class='player'><div class='picture'>",
                    pictures   = id3['Attached picture'],
                    artist     = this.ofmTrack ? this.ofmTrack.artist_string : id3['Lead artist/Lead performer/Soloist/Performing group'];
                    
                if(this.ofmTrack) {
                    
                    id3string += "<img class='picture' src='" + this.ofmTrack.picture_absolute_url.replace('_small', '_large') + "' />";
                    
                } else if (pictures) {
                    
                    var mime = pictures[0].mime,
                        enc  = btoa(pictures[0].value);
                    
                    id3string += "<img class='picture' src='data:" + mime + ';base64,' + enc + "' />";
                    
                } else {
                    
                    id3string += "<img class='picture' src='../images/nopicture.png' />";
                }
                
                id3string += "<a href='#' id='playpause' class='button play'></a>";
                id3string += "<div class='timeline'><div id='preloadbar'><div id='progressbar'></div></div></div>";
                
                id3string += "</div></div>";
                id3string += "<div class='info'>";
                
                id3string += "<h2 id='track_span'>" + (this.ofmTrack ? this.ofmTrack.title : id3['Title/Songname/Content description']) + "</h2>";
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
                
                this.ofmTrack = null;
                
                id3element.innerHTML = id3string;
                
                // TODO: Make these elements configurable (will be part of the future refactor).
                this.el.progressBar = document.getElementById( 'progressbar' );
                this.el.preloadBar  = document.getElementById( 'preloadbar' );
                this.el.playPause   = document.getElementById( 'playpause' );
                
                this.el.playPause.onclick = function( ev )
                {
                    player.setPlaying(!player.playing);
                    
                    return false;
                };
                
                // musicbrainz + musicmetric queries
                /* Disabled for now, as there is no backend to handle this request.
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
                */
            }
            
            this.player.onProgress = function( current, total, preload )
            {
                self.onProgress(current, total, preload);
            }
            
            this.player.onPlay = function()
            {
                self.el.playPause.className = 'button pause';
            };
            
            this.player.onPause = function()
            {
                self.el.playPause.className = 'button play';
            };
            
            this.player.createDevice();
        }
        
    };
    
    var mhd = new MHD( {
        ofmAPIKey : 'Q5Bd7987TmfsNVOHP9Zt',
        el : {
            // playPause  : '#playpause',
            // preloadBar : '#preloadbar',
            // progressBar: '#progressbar',
            fileChooser: '#fileChooser',
            trackId    : '#ofm',
            id3        : '#ID3',
            playUrl    : '#playUrl'
        }
    } );
    
    window.onload = function()
    {
        mhd.onPageLoad();
    };
    
} )();