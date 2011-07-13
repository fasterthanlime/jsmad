if(typeof jQuery == 'undefined') {
    alert('jQuery must be loaded for officialfm-javascript to work.');
}

function OfficialFM(api_key, preload_player) {
    this.api_key = api_key;
    
    if(preload_player) OfficialFM.is_player_loaded();
}

OfficialFM.VERSION = '0.0.1';
OfficialFM.API_URL = 'http://api.official.fm/';

OfficialFM.LOADING_TRIES_INTERVAL = 250; /* in ms */
OfficialFM.MAX_LOADING_TRIES = 30000 / OfficialFM.LOADING_TRIES_INTERVAL; /* try loading for 30 seconds */

OfficialFM.player_loading = false;
OfficialFM.loading_tries = 0;

OfficialFM.is_player_loaded = function () {
    if (typeof OfficialFM.Player == "undefined") {
        if (!OfficialFM.player_loading) {
            OfficialFM.player_loading = true;
            $.getScript("https://github.com/officialfm/officialfm-javascript/raw/master/player_api.js");
        }
        return false;
    }
    return true;
}

OfficialFM.with_player = function (callback) {
    if(!callback) return;
    
    if(OfficialFM.is_player_loaded()) {
        callback();
    } else {
        if(OfficialFM.loading_tries < OfficialFM.MAX_LOADING_TRIES) {
            OfficialFM.loading_tries++;
            setTimeout(function () {
                OfficialFM.with_player(callback);
            }, OfficialFM.LOADING_TRIES_INTERVAL);
        }
    }
}

/**
 * Internal function used to query the server easily
 */
OfficialFM.prototype.call_api = function(sub_url, callback, other_params) {
    var default_params = {
        key: this.api_key,
        format: 'json'
    }
    var params = default_params;
    for (attrname in other_params) {
        if(attrname == 'limit') {
            params['api_max_responses'] = other_params[attrname];
        } else if(attrname == 'embed') {
            params['api_embed_codes'] = other_params[attrname];
        } else {
            params[attrname] = other_params[attrname];
        }
    }
    
    var url = OfficialFM.API_URL + sub_url;
    $.ajax({
        url: url,
        data: params,
        dataType: 'jsonp',
        success: callback
    });
}

/**
 * Create an Official.fm player
 * 
 * Valid options:
 * - container_id : string : id of the container. ex : 'player_container'
 * - type : string : content type : track/playlist (todo : user, dynamic tracklist..)
 * - id : content id : track/playlist's id
 * - aspect : optional. string : aspect of player : [large], standard, artwork, small, mini. ex : 'artwork'
 * - skin : optional. number : skin id (null = default skin). ex : 123
 * - width : optional. string or number : width of player in pixel - or percentage when used with %. (valid only for artwork & small players). ex : '300' or '60%'
 * - onReady : listener with no param. Called when player is ready to play.
 * - onPlay : listener with 1 param track_id. Called when a track starts playing
 * - onPause : listener with 1 param track_id. Called when a track is being paused
 * - onProgress : listener with 1 param object {played_seconds, played_percent, total}. Called twice per second minimum.
 * - onChangeTrack : listener with 1 param track_id. Called when player switch to another track
 * - onChangeTracklist : listener with no param. Called when player switch to another tracklist
 * - onTracklistEnd : listener with no param. Called when tracklist's end is reached.
 *
 * Subsequent calls to player() with the same div_id will replace
 * previous instances of the player hosted in the given div
 * 
 */
OfficialFM.prototype.player = function (options, callback) {
    if(!options.hasOwnProperty('container_id')) {
        options.container_id = 'player_container';
    }
        
    if(!options.hasOwnProperty('type')) {
        options.type = 'track';
    }
    
    if(!options.hasOwnProperty('aspect')) {
        options.aspect = 'small';
    }
    
    OfficialFM.with_player(function() {
        var _player = OfficialFM.Player.create(options);
        /* Hack to add play_track to a player */
        _player.play_track = function(track_id) {
            this.play(track_id, OfficialFM.Player.build_feed('track', track_id));
        }
        callback(_player);
    });
}

/**
 * Create an Official.fm track player
 * 
 * @param div_id The ID of the div the player will be put in
 * @param track_id content id : The ID of the track that should be played
 * @param options :
 *  - callback: function taking the player object as an argument
 *  - all other options valid in OfficialFM.player()
 * 
 * Subsequent calls to track_player() with the same div_id will replace
 * previous instances of the player hosted in the given div
 * 
 * Example:
 *  ofm.track_player('player_div', 226556)
 */
OfficialFM.prototype.track_player = function (div_id, track_id, options) {
    if(!options) options = {};
    options.container_id = div_id;
    options.type = 'track';
    options.id = track_id;
    if(!options.hasOwnProperty('callback')) options.callback = function() {};
    
    this.player(options, options.callback);
}

/**
 * Create an Official.fm playlist player
 * 
 * @param div_id The ID of the div the player will be put in
 * @param track_id content id : The ID of the track that should be played
 * @param options :
 *   - callback: function taking the player object as an argument
 *   - all other options valid in OfficialFM.player()
 * 
 * Subsequent calls to playlist_player() with the same div_id will replace
 * previous instances of the player hosted in the given div
 */
OfficialFM.prototype.playlist_player = function (div_id, playlist_id, options) {
    if(!options) options = {};
    options.container_id = div_id;
    options.type = 'playlist';
    options.id = playlist_id;
    if(!options.hasOwnProperty('callback')) options.callback = function() {};
    
    this.player(options, options.callback);
}

/* ==================== users functions ===================== */

/**
 * Search for users
 * 
 * @param string search_param: a search parameter (eg +  name of the user)
 * @param int limit (50) limit per page
 * @User list
 */
OfficialFM.prototype.users = function (search_term, callback, options) {
  this.call_api('search/users/' + encodeURI(search_term), callback, options);
}

OfficialFM.prototype.each_user = function (search_term, callback, options) {
  this.users(search_term, function(users) { $.each(users, callback) }, options);
}
      
/**
 * Retrieve information about a specific user
 * 
 * @param string user_id: id or login
 * @a User object
 */
OfficialFM.prototype.user = function (user_id, callback, options) {
  this.call_api('user/' + user_id, function(data) { callback(data[0]); }, {});
}

/**
 * Retrieve a list of the tracks of this user
 *
 * @param string user_id: id or login
 * @param integer limit (50) limit per page
 * @param bool embed (false) should embed codes be included in the response
 * @array Track list
 */
OfficialFM.prototype.user_tracks = function (user_id, callback, options) {
  this.call_api('user/' + user_id + '/tracks', callback, options);
}

OfficialFM.prototype.each_user_track = function (search_term, callback, options) {
  this.user_tracks(search_term, function(user_tracks) { $.each(user_tracks, callback) }, options);
}

/**
* Retrieve a list of the playlists of this user
*
* @param string user_id: id or login
* @param integer limit (50) limit per page
* @param bool embed (false) should embed codes be included in the response
* @array Playlist list
*/
OfficialFM.prototype.user_playlists = function (user_id, callback, options) {
  this.call_api('user/' + user_id + '/playlists', callback, options);
}

OfficialFM.prototype.each_user_playlists = function (search_term, callback, options) {
  this.user_playlists(search_term, function(user_playlists) { $.each(user_playlists, callback) }, options);
}

/**
 * Retrieve a list of the subscribers of this user
 *
 * @param string user_id: id or login
 * @param integer limit (50) limit per page
 * @array User list
 */
OfficialFM.prototype.user_subscribers = function (user_id, callback, options) {
  this.call_api('user/' + user_id + '/subscribers', callback, options);
}

OfficialFM.prototype.each_user_subscribers = function (search_term, callback, options) {
  this.user_subscribers(search_term, function(user_subscribers) { $.each(user_subscribers, callback) }, options);
}

/**
 * Retrieve a list of the subscriptions of this user
 *
 * @param string user_id: id or login
 * @param integer limit (50) limit per page
 * @array User list
 */
OfficialFM.prototype.user_subscriptions = function (user_id, callback, options) {
  this.call_api('user/' + user_id + '/subscriptions', callback, options);
}

OfficialFM.prototype.each_user_subscriptions = function (search_term, callback, options) {
  this.user_subscriptions(search_term, function(user_subscriptions) { $.each(user_subscriptions, callback) }, options);
}

/**
 * Retrieve a list of the contacts of this user
 *
 * @param string user_id: id or login
 * @param integer limit (50) limit per page
 * @param bool embed (false) should embed codes be included in the response
 * @array User list
 */
OfficialFM.prototype.user_contacts = function (user_id, callback, options) {
  this.call_api('user/' + user_id + '/contacts', callback, options);
}

OfficialFM.prototype.each_user_contacts = function (search_term, callback, options) {
  this.user_contacts(search_term, function(user_contacts) { $.each(user_contacts, callback) }, options);
}

/* ==================== tracks functions ===================== */

/**
 * Search for tracks
 *
 * @param string search_param: a search parameter (eg +  name of the track)
 * @param integer limit (50) limit per page (optional)
 * @array Track list
 */
OfficialFM.prototype.tracks = function (search_term, callback, options) {
  this.call_api('search/tracks/' + encodeURI(search_term), callback, options);
}

OfficialFM.prototype.each_track = function (search_term, callback, options) {
  this.tracks(search_term, function(tracks) { $.each(tracks, callback) }, options);
}

/**
 * Retrieve information about a specific track
 *
 * Note: http://official + fm/developers/simple_api#track_show
 * says that api_max_responses is a valid parameter +  Why escapes me + 
 *
 * @param string track_id: id
 * @param bool embed (false) should embed codes be included in the response
 * @array Track
 */
OfficialFM.prototype.track = function (track_id, callback, options) {
  this.call_api('track/' + track_id, function(data) { callback(data[0]); }, options);
}

/**
 * Retrieve users that have voted for this track
 *
 * @param string track_id: id
 * @param integer limit (50) limit per page
 * @array User list
 */
OfficialFM.prototype.track_votes = function (track_id, callback, options) {
  this.call_api('track/' + track_id + '/votes', callback, options);
}

OfficialFM.prototype.each_track_vote = function (search_term, callback, options) {
  this.track_votes(search_term, function(track_votes) { $.each(track_votes, callback) }, options);
}

/**
 * Retrieve 200 tracks of selected chart
 *
 * @param string charting: 'today', 'week', 'month', 'year' or 'all_time'
 * @param string genre: Genre string ('Electronic', 'Rock', 'Jazz', ...) (optional)
 * @param string country: ISO country id (CH, FR, UK) (optional)
 * @param bool embed (false) should embed codes be included in the response (optional)
 * @param integer limit (200) limit per page (optional)
 * @array Track list
 */
OfficialFM.prototype.charts = function (charting, callback, options) {
  this.call_api('tracks/charts', callback, $.extend({}, options, { charting: charting }));
}

OfficialFM.prototype.each_chart = function (search_term, callback, options) {
  this.charts(search_term, function(charts) { $.each(charts, callback) }, options);
}

/**
 * Retrieve 200 latest tracks
 *
 * @param string genre: Genre string (Electronic, Rock, Jazz,  +  +  + ) (optional)
 * @param string country: ISO country id (CH, FR, UK) (optional)
 * @param bool embed (false) should embed codes be included in the response (optional)
 * @param integer limit (200) limit per page (optional)
 * @array Track list
 */
OfficialFM.prototype.latest = function (callback, options) {
    this.call_api('tracks/latest', callback, options);
}

OfficialFM.prototype.each_latest = function (callback, options) {
  this.latest(function(latests) { $.each(latests, callback) }, options);
}

/* ==================== playlists functions ===================== */

/**
 * Search for playlists
 *
 * @param string search_param: a search parameter (eg +  name of the playlist)
 * @param integer limit (50) limit per page (optional)
 * @array Playlist list
 */
 OfficialFM.prototype.playlists = function (search_param, callback, options) {
     this.call_api('search/playlists/' + encodeURI(search_param), function(result) {
         callback($.map(result, OfficialFM.improve_playlist));
     }, options);
 }
 
 OfficialFM.prototype.each_playlist = function (search_term, callback, options) {
  this.playlists(search_term, function(playlists) { $.each(playlists, callback) }, options);
 }
 
/**
 * Retrieve information about a specific playlist
 *
 * @param string playlist_id: id
 * @param bool embed (false) should embed codes be included in the response
 * @array Playlist
 */
 OfficialFM.prototype.playlist = function (playlist_id, callback, options) {
    this.call_api('playlist/' + playlist_id, function(result) {
        callback(OfficialFM.improve_playlist(result[0]));
    }, options);
 }
 
/**
 * Retrieve users that have voted for this playlist
 *
 * @param string playlist_id: id
 * @param integer limit (50) limit per page
 * @array User list
 */
 OfficialFM.prototype.playlist_votes = function (playlist_id, callback, options) {
     this.call_api('playlist/' + playlist_id + '/votes', callback, options);
 }
 
 OfficialFM.prototype.each_playlist_vote = function (search_term, callback, options) {
  this.playlist_votes(search_term, function(playlist_votes) { $.each(playlist_votes, callback) }, options);
 }

 /* Hack to improve playlist id lists (see issue #4 in sandbox-api) */
 OfficialFM.improve_playlist = function (playlist) {
     playlist.running_time = playlist['length'];
     /* TODO: actually improve the item list ha*/
     return playlist;
 }

