//Subsonic Models 
var SubsonicFolder = function(data){
	var self = this;
	self.id = ko.observable(data.id);
	self.name = ko.observable(data.name);
}

var SubsonicMusicDirectory = function(data){
	var self = this;
	self.id = data.id;
	self.name = data.name;
	if(data.child){
		self.child = data.child;	
	}


}
var SubsonicIndex = function(data){
	var self = this;
	self.id = (data.id) ? data.id : '';
	self.name = data.name;
	self.folders = ko.observableArray([]);
	if(data.artist){
		var Folders =  $.map(data.artist,
			function(folder) {
				return new SubsonicFolder(folder);
			}
		);
		self.folders(Folders);
	}
}

var utils = {
	hideall: function(){
		//each time you add a new page, list it here and set the show observable to false
		Asub.Content.showRFolders(false);
		Asub.Content.showFolder(false);
		Asub.Content.showFrontPage(false);
		Asub.Search.showSearchResults(false);
		Asub.Player.showPlaylist(false);
		Asub.Chat.showChatWindow(false);
	},
	sleep: function(milliseconds) {
		var start = new Date().getTime();
		for (var i = 0; i < 1e7; i++) {
	    	if ((new Date().getTime() - start) > milliseconds){
	      		break;
	    	}
	  	}
	}	
};

//custom bindng
ko.bindingHandlers.slideVisible = {
    update: function(element, valueAccessor, allBindingsAccessor) {
        // First get the latest data that we're bound to
        var value = valueAccessor(), allBindings = allBindingsAccessor();
         
        // Next, whether or not the supplied model property is observable, get its current value
        var valueUnwrapped = ko.utils.unwrapObservable(value); 
         
        // Grab some more data from another binding property
        var duration = allBindings.slideDuration || 'slow'; // 400ms is default duration unless otherwise specified
         
        // Now manipulate the DOM element
        if (valueUnwrapped == true) 
            $(element).slideDown(duration); // Make the element visible
        else
            $(element).slideUp(duration);   // Make the element invisible
    }
};


ko.bindingHandlers.jwPlayer = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var videoUrl = ko.utils.unwrapObservable(valueAccessor());
        var allBindings = allBindingsAccessor();

        var mysources = [];
        if (videoUrl[0]) mysources.push({ file: videoUrl[0] });
        if (videoUrl[1]) mysources.push({ file: videoUrl[1] });
        if (videoUrl[2]) mysources.push({ file: videoUrl[2] });
        
        var options = {
            playlist: [{
                image: allBindings.posterUrl(),
                sources: mysources
            }],            
            height: 450,
            width: 800,          
        };

        jwplayer(allBindings.playerId).setup(options);
    },

    update: function(element, valueAccessor, allBindingsAccessor) {
        var videoUrl = ko.utils.unwrapObservable(valueAccessor());
        var allBindings = allBindingsAccessor();

        var mysources = [];
        if (videoUrl[0]) mysources.push({ file: videoUrl[0] });
        if (videoUrl[1]) mysources.push({ file: videoUrl[1] });
        if (videoUrl[2]) mysources.push({ file: videoUrl[2] });

        
        var playlist = [{
                image: allBindings.posterUrl(),
                sources: mysources
            }];
                   
        jwplayer(allBindings.playerId).onReady(function() {
            jwplayer(allBindings.playerId).load(playlist);
        });
    }
};


toastr.options.positionClass = 'toast-top-right';
Asub.error = function(msg){
	alert(msg);//for now keep it simple
}
Asub.init = function(){
	//Anything you need to do to start the app goes here
	
	//Check Local Storeage For Creds
	console.log($.jStorage.index());

	if($.jStorage.get('Asub.login.username') && $.jStorage.get('Asub.login.username') != ''){
		Asub.Login.username($.jStorage.get('Asub.login.username'));	
	}else{
		$.jStorage.set('Asub.login.loggedIn',false);
	}
	
	if($.jStorage.get('Asub.login.password') && $.jStorage.get('Asub.login.password') != ''){
		Asub.Login.password($.jStorage.get('Asub.login.password'));	
	}else{
		$.jStorage.set('Asub.login.loggedIn',false);
	}
	
	if($.jStorage.get('Asub.server') && $.jStorage.get('Asub.server') != ''){
		Asub.server($.jStorage.get('Asub.server'));	
	}else{
		$.jStorage.set('Asub.login.loggedIn',false);
	}
	
	if($.jStorage.get('Asub.login.loggedIn') == true){
		Asub.Login.loggedIn(true);
	}else Asub.Login.loggedIn(false);
	
	
	//if logged in, got to root folder screen
	if(Asub.Login.loggedIn() == true){
		if(Asub.Content.rFolders().length < 1){
			console.log("Getting The Roots");
			Asub.Content.getRootFolders();
			Asub.Chat.init();
			Asub.Player.init();
		}
		Asub.Routes.run('#/FrontPage/newest');
	}else{
		$.jStorage.flush();
		Asub.Routes.run('#/login');
	}
};

Asub.Login = {
	loggedIn: ko.observable(false),
	username: ko.observable(),
	password: ko.observable(),
	error: ko.observable(),
	rememberMe: ko.observable(false),

	login: function(){
		if(Asub.Login.username() == ''){
			Asub.Login.error("Login Failed, Username Required");
		}
		if(Asub.Login.password() == ''){
			Asub.Login.error("Login Failed, Password Required");
		}
		if(Asub.server() == ''){
			Asub.Login.error("Login Failed, Server Required");
		}		
		Asub.API.ping(function(res){//we use the ping to verify auth and log you in so to speak			
			if(res.status == 'ok'){
				Asub.Login.loggedIn(true);
				Asub.Content.getRootFolders();
				if(Asub.Login.rememberMe()){
					$.jStorage.set('Asub.login.username',Asub.Login.username());
					$.jStorage.set('Asub.login.password',Asub.Login.password());
					$.jStorage.set('Asub.server',Asub.server());
					$.jStorage.set('Asub.login.loggedIn',Asub.Login.loggedIn());
				}else{
					Asub.Login.rememberMe();
					$.jStorage.flush();
				}
				window.location.hash = '#/FrontPage/newest';
				return;
			}else{
				Asub.Login.error("Login Failed");
			}
		});
	},
	logout: function(){
		Asub.Login.loggedIn(false);		
	}

};

Asub.Content = {
	rFolders: ko.observableArray([]),
	indexs: ko.observableArray([]),
	folders: ko.observableArray([]),
	rFolder: ko.observable(false),
	currentArtist: ko.observable(),
	currentArtistChildren: ko.observableArray(),
	folder: ko.observable(),

	previous: ko.observable(),
	loading: ko.observable(false),
	refreshNext: false,
	showRFolders: ko.observable(false),
	showFolder: ko.observable(false),
	showFrontPage: ko.observable(false),

	fpOffset: ko.observable(0),
	fpCount: ko.observable(50),
	pflistType: ko.observable('newest'),
	frontPageItems: ko.observableArray(),
	setRootFolder: function(rootFolder){
		Asub.Content.rFolder(rootFolder.id());
		window.location.href ='#/rf';
	},
	getRootFolders: function(){
		Asub.API.getFolders(function(res){
			if(res.status=='ok'){
				if(res.musicFolders){
					var Folders =  $.map(res.musicFolders.musicFolder,
						function(folder) {
							return new SubsonicFolder(folder);
						}
					);
					Asub.Content.rFolders(Folders);
					if(!Asub.Content.rFolder()) Asub.Content.rFolder(Asub.Content.rFolders()[0].id());
				}else{
					Asub.error("Failed to get Root Folder List, Status was "+ res.musicFolders.status);
				}	
			}else{
				Asub.error("Failed to get Root Folder List!");
			}
		});		
	},
	getIndex: function(){
		//check local storage for cache list
		var cacheIndex = $.jStorage.get('Asub.Content.Folder.'+Asub.Content.rFolder());
		if(cacheIndex != null && cacheIndex.length > 0){
			//if it has content, skip the API call
			var Indexs =  $.map(cacheIndex,
				function(index) {
					return new SubsonicIndex(index);
				}
			);
			Asub.Content.indexs(Indexs);
			if(Asub.Content.refreshNext == false){
				return;
			}else if(Asub.Content.refreshNext == true){
				Asub.Content.refreshNext = false;//make it false now and fall through to refresh ;)
			}
		}
		
		Asub.API.getIndex(Asub.Content.rFolder(),function(res){
			console.log(res);
			if(res.status == 'ok'){
				if(res.indexes){
					var Indexs =  $.map(res.indexes.index,
						function(index) {
							return new SubsonicIndex(index);
						}
					);
					Asub.Content.indexs(Indexs);
					$.jStorage.set('Asub.Content.Folder.'+Asub.Content.rFolder(),res.indexes.index);				
				}else{
					Asub.error("Failed to get Folder Index");
				}	
			}else{
				Asub.error("Failed to get Folder Index");
			}
		});			
	},
	goToFolder: function(media){
		Asub.Content.getMusicDirectory(media);
	},
	download: function(media){
		return Asub.API.download(media);
	},
	loadContent: function(media){
		if(media.isDir == true){
			Asub.Content.getMusicDirectory(media);
			window.location.href = "#/rf";
		}else{
			switch(media.contentType){
				case 'audio/mpeg':
					Asub.API.stream({id: media.id, format: 'flv'});
					break;
				default:
					break;
			}
		}
		
	},
	getMusicDirectory: function(media){
		//utils.hideall();
		//Asub.Content.showFolder(true);		
		//c = currently selected index folder
		Asub.Content.previous((media.parent) ? media.parent : Asub.Content.rFolder());
		Asub.Content.folder(( typeof media.id == 'function') ? media.id() : media.id);
		//check local storage for cache list
		var cacheIndex = $.jStorage.get('Asub.Content.Folder.'+Asub.Content.folder());
		if(cacheIndex != null && cacheIndex.length > 0){
			//if it has content, skip the API call
			Asub.Content.currentArtist({id: cacheIndex.id, name: cacheIndex.name});
			Asub.Content.currentArtistChildren(cacheIndex.child);			
			if(Asub.Content.refreshNext == false){
				return;
			}else if(Asub.Content.refreshNext == true){
				Asub.Content.refreshNext = false;//make it false now and fall through to refresh ;)
			}
		}
		
		Asub.API.getMusicDirectory(Asub.Content.folder(),function(res){
			if(res.status == 'ok'){
				if(res.directory){
					Asub.Content.currentArtist(new SubsonicMusicDirectory(res.directory));
					Asub.Content.currentArtistChildren(res.directory.child);
					$.jStorage.set('Asub.Content.Folder.'+Asub.Content.folder(),res.directory);				
				}else{
					Asub.error("Failed to get Folder");
				}	
			}else{
				Asub.error("Failed to get Folder!");
			}
		});		
	},

	scrollTop: function(){
		$('#artistsFolders').animate({
		scrollTop: 0
		}, 'slow');		
	},
	getAlbumList: function(){
		Asub.API.getAlbumList({listType:Asub.Content.pflistType(), size: Asub.Content.fpCount(), offset: Asub.Content.fpOffset()},function(res){
			if(res.status=='ok'){
				var albums =  $.map(res.albumList.album,
						function(album) {
							if(!album.coverArt){
								album.coverArt = false;
							}
							return album;
						}
				);
				Asub.Content.frontPageItems(albums);
			}
		});
	},
	getFPCoverArt: function(album){
		album.size = '180';
		return Asub.API.getCoverArt(album);
	},
	pfNext: function(){
		var cnt =  Asub.Content.fpCount();
		var ofst = Asub.Content.fpOffset();
		
		if(ofst==0){
			Asub.Content.fpOffset(cnt);
		}else if(ofst > 0){
			ofst = cnt+ofst;
			Asub.Content.fpOffset(ofst);	
		}
		
	},
	pfPrevious: function(){
		var cnt =  Asub.Content.fpCount();
		var ofst = Asub.Content.fpOffset();
		
		if(ofst==0){
			Asub.Content.fpOffset(0);
		}else if(ofst > 0){
			ofst = ofst - cnt;
			if(ofst < 0) ofst = 0;
			Asub.Content.fpOffset(ofst);	
		}
		
	}
};
Asub.Search = {
	query: ko.observable(),
	albumSearchResults: ko.observableArray(),
	songSearchResults: ko.observableArray(),
	artistSearchResults: ko.observableArray(),
	showSearchResults: ko.observable(false),	
	doSearch: function(s){
		Asub.API.search2({
			query: s
		},
		function(res){
			if(res.status == 'ok'){
				Asub.Search.albumSearchResults(res.searchResult2.album);
				Asub.Search.songSearchResults(res.searchResult2.song);
				Asub.Search.artistSearchResults(res.searchResult2.artist);
			}
		});
	},	
};

Asub.Player = {
	showVideoPlayer: ko.observable(false),
	showAudioPlayer: ko.observable(false),
	showPlaylist: ko.observable(false),
	nowPlaying: ko.observable(0),
	currentSource: ko.observable(),
	currentType: ko.observable(),	
	currentPlayer: ko.observable(),
	currentArt: ko.observable(),
	playerState: ko.observable('pause'),
	q: ko.observableArray([]),
	maxBitRate: false,
	init: function(){
		//reload playlist from cache
		var queue = $.jStorage.get('Asub.Player.q');
		if(queue){
			if(queue.length > 0){
				Asub.Player.q(queue);
			}
		}
	},
	addToPlayList: function(item){
		if(item.hasOwnProperty('isDir')  && item.isDir){
			//Get Children
			Asub.API.getMusicDirectory(item.id,function(res){
				if(res.status == 'ok'){
					if(res.directory){
						for(var i = 0; i < res.directory.child.length; i++){
							Asub.Player.addToPlayList(res.directory.child[i]);	
						}
					}else{
						Asub.error("Failed to get Folder");
					}	
				}else{
					Asub.error("Failed to get Folder!");
				}
			});
			
		}else{
			item.played = false;
			Asub.Player.q.push(item);
			toastr.success('<b>'+item.title + '</b> has been added to your current playlist, click now playing to review', 'Playlist Updaated!')
		} 
	},
	addToPlayListAndPlay: function(item){
		//TODO should we clear the playlist first?
		Asub.Player.q([]);
		Asub.Player.addToPlayList(item);
		Asub.Player.play();//play first item in q	
	},
	remveFromPlaylist: function(item){
		Asub.Player.q.remove(item);
	},
	stepBackward: function(){
		var i = Asub.Player.nowPlaying();
		if(Asub.Player.q()[i--]){
			Asub.Player.nowPlaying(i--);
			var s = Asub.Player.q()[Asub.Player.nowPlaying()];
			Asub.Player.play(s); 
		}		
	},
	stepForward: function(){
		var i = Asub.Player.nowPlaying();
		if(Asub.Player.q()[i++]){
			Asub.Player.nowPlaying(i++);
			var s = Asub.Player.q()[Asub.Player.nowPlaying()];
			Asub.Player.play(s);
		}		
	},
    play: function(){
            media = Asub.Player.q()[Asub.Player.nowPlaying()];
            console.log('play');
            console.log(media);
            if(media.isVideo) var type = 'video';
            if(!media.isVideo) var type = 'song';

            //Set the artwork
            Asub.Player.currentArt(Asub.API.getCoverArt({coverArt: media.coverArt, size: 60 }));
            if(type == 'song'){
                    Asub.Player.musicInit(media);
            }else if(type == 'video'){
                    Asub.Player.videoInit(media);
            }
            //finaly Change icon state
            Asub.Player.playerState('play');

    },
	remove: function(media){
		Asub.Player.q.remove(media);
	},
	mediaEnd: function(){
		//Mark the current item placed, set the 
		if(Asub.Player.q().length > 0){
			Asub.Player.q()[Asub.Player.nowPlaying()].played;
			var i = Asub.Player.nowPlaying();
			if(Asub.Player.q()[i++]){
				Asub.Player.nowPlaying(i++);
				var s = Asub.Player.q()[Asub.Player.nowPlaying()];
				Asub.Player.play(s);
			}
		}
	},
	pause: function(){
		Asub.Player.playerState('pause');
		Asub.Player.currentPlayer().pause();
	},
    musicInit: function(song){
			Asub.Player.showAudioPlayer(true);

            var m = {id: song.id};
            if(song.suffix){
                    m.format = song.suffix;//stream format
            }
            if(Asub.Player.maxBitRate){
                    m.maxBitRate = Asub.Player.maxBitRate;
            }

            var songSrc = Asub.API.stream(m);
            console.log("Song Path");
            console.log(songSrc);
            console.log('EOF');
            Asub.Player.currentSource(songSrc);
            Asub.Player.currentType(song.contentType);            
            if(Asub.Player.currentPlayer()){
                    Asub.Player.currentPlayer().pause();
            }

            var player = new MediaElementPlayer('#asubAudioPlayer',{
            	type: song.contentType,
			    // if the <video width> is not specified, this is the default
			    defaultVideoWidth: 480,
			    // if the <video height> is not specified, this is the default
			    defaultVideoHeight: 270,
			    // if set, overrides <video width>
			    videoWidth: -1,
			    // if set, overrides <video height>
			    videoHeight: -1,
			    // width of audio player
			    audioWidth: '100%',
			    // height of audio player
			    audioHeight: 40,
			    // initial volume when the player starts
			    startVolume: 0.8,
			    // useful for <audio> player loops
			    loop: false,
			    // enables Flash and Silverlight to resize to content size
			    enableAutosize: true,
			    // the order of controls you want on the control bar (and other plugins below)
			    features: ['playpause','progress','current','duration','tracks','volume','fullscreen'],
			    // Hide controls when playing and mouse is not over the video
			    alwaysShowControls: false,
			    // force iPad's native controls
			    iPadUseNativeControls: false,
			    // force iPhone's native controls
			    iPhoneUseNativeControls: false, 
			    // force Android's native controls
			    AndroidUseNativeControls: false,
			    // forces the hour marker (##:00:00)
			    alwaysShowHours: false,
			    // show framecount in timecode (##:00:00:00)
			    showTimecodeFrameCount: false,
			    // used when showTimecodeFrameCount is set to true
			    framesPerSecond: 25,
			    // turns keyboard support on and off for this instance
			    enableKeyboard: true,
			    // when this player starts, it will pause other players
			    pauseOtherPlayers: true,
			    // array of keyboard commands
			    keyActions: []
			 
			});
            player.pause();
            player.play();
            Asub.Player.currentPlayer(player);

    },
	videoInit: function(video){
		Asub.Player.showVideoPlayer(true);
		var m = {id: video.id};
		var _defaultHeigt = '480';
		var _defaultWidth = '720';
        if(video.suffix){
                m.format = video.suffix;//stream format
        }
        if(Asub.Player.maxBitRate){
                m.maxBitRate = Asub.Player.maxBitRate;
        }		
		if(mobilecheck()){
			//set hls
			var _type = 'application/vnd.apple.mpegurl';
			_defaultHeigt = '320';
			_defaultWidth = '480';
			var videoSrc = Asub.API.hls(m);
		}else{
			//set flash
			var _type = 'video/x-flv';
			m.format = 'flv';
			m.size = _defaultHeigt + 'X' + _defaultWidth;
			var videoSrc = Asub.API.stream(m);
		}
		
		Asub.Player.currentType(_type);

        
        console.log("Video Path");
        console.log(videoSrc);
        console.log('EOF');
        Asub.Player.currentSource(videoSrc);
                    
        if(Asub.Player.currentPlayer()){
                Asub.Player.currentPlayer().pause();
        }
		
		var player = $('#asubVideoPlayer').mediaelementplayer({
			type: Asub.Player.currentType(),
		    // if the <video width> is not specified, this is the default
		    defaultVideoWidth: _defaultWidth,
		    // if the <video height> is not specified, this is the default
		    defaultVideoHeight: _defaultHeigt,
	        plugins: ['flash','silverlight'],
		    //plugin path
		    pluginPath: 'js/vendor/',
		    //flash player
			flashName: 'flashmediaelement.swf',
		    // name of silverlight file
		    silverlightName: 'silverlightmediaelement.xap',		    
		    videoWidth: -1,
		    videoHeight: -1,
		    audioWidth: 400,
		    audioHeight: 30,
		    startVolume: 0.8,
		    loop: false,
		    // enables Flash and Silverlight to resize to content size
		    enableAutosize: true,
		    features: ['playpause','progress','current','duration','tracks','volume','fullscreen'],
		    // Hide controls when playing and mouse is not over the video
		    alwaysShowControls: false,
		    iPadUseNativeControls: true,
		    iPhoneUseNativeControls: true, 
		    AndroidUseNativeControls: true,
		    framesPerSecond: 25,
		    enableKeyboard: true,
		    pauseOtherPlayers: true,
		    keyActions: []
		});
	}
	
};




Asub.Chat = {
	messages: ko.observableArray([]),
	message: ko.observable(),
	unseen: ko.observable(0),	
	lastChecked: ko.observable(0),
	showChatWindow: ko.observable(false),
	
	init: function(){
		//Start Chat server polling cycle
		Asub.Chat.getMessages();
		window.setInterval(function(){
		  /// call your function here
		  Asub.Chat.getMessages();
		}, 5000);		
	},
	showAvatar: function(username){
		return Asub.API.getAvatar({username: username});		
	},
	getMessages: function(){
		Asub.API.getChatMessages({since: Asub.Chat.lastChecked()},function(res){
			if(res.status == 'ok'){
				//chatMessages
				if(res.chatMessages){
					if(Object.prototype.toString.call( res.chatMessages ) === '[object Object]' ){
						
						if(res.chatMessages.chatMessage.length > 0){
							for(var i = 0; i < res.chatMessages.chatMessage.length; i++){
								var msg = res.chatMessages.chatMessage[i];								
								//if page not active, update unseen counter
								if( false === Asub.Chat.showChatWindow() ){
									Asub.Chat.unseen(Asub.Chat.unseen() + 1);
								}						
	

								var dt = moment(new Date(msg.time));
								msg.time = dt.format('YYYY/MM/DD h:mm:ss a');						
								Asub.Chat.messages.unshift(msg);
							}
						}else{
							var msg = res.chatMessages.chatMessage;						
							if( false === Asub.Chat.showChatWindow() ){
								Asub.Chat.unseen(Asub.Chat.unseen() + 1);
								toastr.success('<stong>'+msg.username + ': </strong> ' + msg.message, 'New Message');								
							}						
							var dt = moment(new Date(msg.time));
							msg.time = dt.format('YYYY/MM/DD h:mm:ss a');						
							Asub.Chat.messages.push(msg);
						}										
					}
					Asub.Chat.lastChecked(new Date().getTime());
				}
			}
		});
	},
	addChatMessage: function(){
		Asub.API.addChatMessage({message: Asub.Chat.message()},function(res){
			if(res.status == 'ok'){
				//chatMessages
				Asub.Chat.getMessages();
			}			
		});
	},
	clearMessages: function(){
		Asub.Chat.messages([]);
	},
	myMessage: function(user){
		return user == Asub.Login.username();
	},
	removeMessage: function(message){
		Asub.Chat.messages.remove(message);
	}
	
};

/*
Asub.Player.showPlaylist.subscribe(function(pl){
	if(Asub.Player.showPlaylist() == true){
		var pl = [];
		for(var t = 0; t < Asub.Player.q().length; t++ ){
			var item = Asub.Player.q()[t];
			var i = {};
			if(item.coverArt) i.image = Asub.Content.getFPCoverArt({coverArt: item.coverArt });
			if(item.title) i.title = item.title;
			i.sources = [];
			i.mediaid = item.id;
			var st = {};
			var m = {id: item.id};
			if(item.suffix){
				st.type = item.suffix;//jwplayer format
				m.format = item.suffix;//stream format
			}
			if(Asub.Player.maxBitRate){
				m.maxBitRate = Asub.Player.maxBitRate
			}
			st.file = Asub.API.stream(m);
			i.sources.push(st);
			if(item.isVideo){
				//hls format also
				st.file = Asub.API.hls(m);
				st.type = 'hls';
				i.sources.push(st);
				//flv format also
				m.format = 'flv';
				st.file = Asub.API.stream(m);
				st.type = 'flv';
				i.sources.push(st);					
			}
		
			
			pl.push(i);
		}
		//return pl;
		console.log($.toJSON(pl));
		jwplayer("asubPlayer").setup({
			playlist: pl,
			height: 360,
		    listbar: {
		        position: 'right',
		        size: 200
		    },
		    width: 700			
		});
	}else{
		return false;
	}	
});
*/
Asub.Player.q.subscribe(function(newValue){
	//on change save to local storage
	$.jStorage.set('Asub.Player.q',newValue);
});

Asub.Content.rFolder.subscribe(function(newValue){
	//When the change the Folder, Update this
	Asub.Content.loading(true);
	Asub.Content.getIndex();
});

Asub.Content.folder.subscribe(function(newValue){
	//When the change the Folder, Update this
	Asub.Content.loading(true);
	Asub.Content.getIndex();
	
});
Asub.Content.fpOffset.subscribe(function(newValue){
	Asub.Content.getAlbumList();
});
Asub.Content.pflistType.subscribe(function(newValue){
	Asub.Content.getAlbumList();
});

Asub.Player.showVideoPlayer.subscribe(function(newValue){
	if( true === newValue ){
		$("#asubVideoPlayerFD").css("display", "block");
	}else{
		$("#asubVideoPlayerFD").css("display", "none");
	}
});

//Routes
Asub.Routes = Sammy(function() {
	this.get('#/404', function() {
		//Show Marvin Error message
		utils.hideall();
	});
	this.get('#/rf', function() {
		utils.hideall();
		//TODO find out why it thinks we are not logged in still?
		if(Asub.Login.loggedIn() == false){
			window.location.hash = '#/login';
		}else{
			if(Asub.Content.rFolders().length < 1) Asub.Content.getRootFolders();
			Asub.Content.showRFolders(true);
		}

	});
	this.get('#/login', function() {
		utils.hideall();
		Asub.Login.logout();
		
	});
	this.get('#/logout', function() {
		utils.hideall();
		Asub.Login.logout();
	});
	this.get('#/Chat', function() {
		utils.hideall();
		Asub.Chat.unseen(0);
		Asub.Chat.showChatWindow(true);
	});	
	this.get('#/Playlist', function() {
		utils.hideall();
		Asub.Player.showPlaylist(true);
	});	
	this.get('#/FrontPage/:listType',function(){
		utils.hideall();
		Asub.Content.showFrontPage(true);
		Asub.Content.pflistType(this.params['listType']);
		Asub.Content.getAlbumList();
	})
	this.get('#/Search/:q',function(){
		utils.hideall();
		Asub.Search.doSearch(this.params['q']);
		Asub.Search.showSearchResults(true);
	})
});


$(document).ready(function(){
	Asub.init();//check for saved info in a cookie or local storage
	ko.applyBindings(Asub, $('#asubnonymousApp')[0]);
	$('#navbar').affix();
	$('#fPlayer').affix();
	
	$('#asubnonymousApp').tooltip({selector: "*[rel=tooltip]"});
	//var asubPlayer =  jwplayer("asubPlayer");
	$('#footerBar').hover(
		function(m_in){
			console.log('test');
			$('#playerWindow').slideToggle("slow");
		},
		function(m_out){
			$('#playerWindow').slideToggle("slow");
		}
	);
	

});

window.mobilecheck = function() {
	var check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
	return check; 
};
