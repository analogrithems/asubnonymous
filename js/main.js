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
		Asub.Player.showPlayer(false);
	},
	sleep: function(milliseconds) {
		var start = new Date().getTime();
		for (var i = 0; i < 1e7; i++) {
	    	if ((new Date().getTime() - start) > milliseconds){
	      		break;
	    	}
	  	}
	},
	isArray: function (o) {
	  return Object.prototype.toString.call(o) === '[object Array]';
	}
};
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
					if(utils.isArray(res.musicFolders.musicFolder)){
						var Folders =  $.map(res.musicFolders.musicFolder,
							function(folder) {
								return new SubsonicFolder(folder);
							}
						);						
					}else{
						//single
						var Folders = [];
						Folders.push(new SubsonicFolder(res.musicFolders.musicFolder));
					}

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
					console.log(res.directory);
					Asub.Content.currentArtist(new SubsonicMusicDirectory(res.directory));
					Asub.Content.currentArtistChildren(res.directory.child);
					console.log(res.directory.child);
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
		console.log('scrolling');
		$('#artistsFolders').animate({
		scrollTop: 0
		}, 'slow');		
	},
	getAlbumList: function(){
		console.log('getAlbumList:'+Asub.Content.pflistType());
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
		console.log(s);
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
	showPlayer: ko.observable(false),
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
		} 
	},
	remveFromPlaylist: function(item){
		Asub.Player.q.remove(item);
	}
};

Asub.Chat = {
	messages: ko.observableArray([]),
	message: ko.observable(),
	lastChecked: ko.observable(0),
	showChatWIndow: ko.observable(false),
	
	init: function(){
		//Start Chat server polling cycle
		Asub.Chat.getMessages();
		window.setInterval(function(){
		  /// call your function here
		  Asub.Chat.getMessages();
		}, 5000);		
	},
	getMessages: function(){
		console.log(Asub.Chat.lastChecked());
		Asub.API.getChatMessages({since: Asub.Chat.lastChecked()},function(res){
			if(res.status == 'ok'){
				//chatMessages
				if(res.chatMessages){
					if(res.chatMessages.chatMessage && res.chatMessages.chatMessage.length > 0){
						console.log(res.chatMessages.chatMessage);
						for(var i = 0; i < res.chatMessages.chatMessage.length; i++){
							var msg = res.chatMessages.chatMessage[i];
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
	}
	
};


Asub.Player.showPlayer.subscribe(function(pl){
	if(Asub.Player.showPlayer() == true){
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
		        size: 320
		    },
		    width: 960			
		});
	}else{
		return false;
	}	
});

Asub.Player.q.subscribe(function(newValue){
	//on change save to local storage
	console.log(newValue);
	$.jStorage.set('Asub.Player.q',newValue);
});

Asub.Content.rFolder.subscribe(function(newValue){
	//When the change the Folder, Update this
	Asub.Content.loading(true);
	Asub.Content.getIndex();
});

Asub.Content.folder.subscribe(function(newValue){
	//When the change the Folder, Update this
	console.log(newValue);
	Asub.Content.loading(true);
	Asub.Content.getIndex();
	
});
Asub.Content.fpOffset.subscribe(function(newValue){
	Asub.Content.getAlbumList();
});
Asub.Content.pflistType.subscribe(function(newValue){
	Asub.Content.getAlbumList();
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
	this.get('#/Player', function() {
		utils.hideall();
		Asub.Player.showPlayer(true);
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
	$('#asubnonymousApp').tooltip({selector: "*[rel=tooltip]"});
	var asubPlayer =  jwplayer("asubPlayer");
});