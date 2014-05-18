Asub = {
	server: ko.observable('https://vault.asynonymous.net/media/')
};

Asub.API = {
	baseArgs: function(){
		return {
			f:'jsonp',
			c:'asubnonymous',
			u:Asub.Login.username(),
			p:Asub.Login.password(),
			v:'1.8.0'
		};	
	},
	getFolders: function(callback){
		$.ajax({
			type: "GET",
			url: Asub.server() + "/rest/getMusicFolders.view",
			data: Asub.API.baseArgs(),
	        dataType: "jsonp",
	        crossDomain: true,
	        success: function(r){
	        	if(r['subsonic-response']) return callback(r['subsonic-response']);
	        	else Asub.error('Failed to get folders');
        	}
		});
	},
	getIndex: function(id,callback){
		var data = Asub.API.baseArgs();
		data.musicFolderId = id;
		$.ajax({
			type: "GET",
			url: Asub.server() + "/rest/getIndexes.view",
			data: data,
	        dataType: "jsonp",
	        crossDomain: true,
	        success: function(r){
	        	if(r['subsonic-response']) return callback(r['subsonic-response']);
	        	else Asub.error('Failed to get Index');
        	}
		});		
	},
	getMusicDirectory: function(id,callback){
		var data = Asub.API.baseArgs();
		data.id = id;
		$.ajax({
			type: "GET",
			url: Asub.server() + "/rest/getMusicDirectory.view",
			data: data,
	        dataType: "jsonp",
	        crossDomain: true,
	        success: function(r){
	        	if(r['subsonic-response']) return callback(r['subsonic-response']);
	        	else Asub.error('Failed to get Folder Contents');
        	}
		});
	},	
	ping: function(callback){
		$.ajax({
			type: "GET",
			url: Asub.server() + "/rest/ping.view",
			data: Asub.API.baseArgs(),
	        dataType: "jsonp",
	        async: false,
	        crossDomain: true,
	        success: function(r){
	        	if(r['subsonic-response']) return callback(r['subsonic-response']);
	        	else return callback(false);
        	}       
		});
	},
	download: function(args){
		var data = $.extend(Asub.API.baseArgs(), args);

		var Content = Asub.server() + '/rest/download.view?'+Asub.API.serialize(data);
		return Content;
	},	
	stream: function(args){
		var data = $.extend(Asub.API.baseArgs(), args);

		var Content = Asub.server() + '/rest/stream.view?'+Asub.API.serialize(data);
		return Content;
	},
	hls: function(args){
		var data = $.extend(Asub.API.baseArgs(), args);

		var Content = Asub.server() + '/rest/hls.m3u8?'+Asub.API.serialize(data);
		return Content;
	},
	serialize: function(obj, prefix) {
	    var str = [];
	    for(var p in obj) {
	        var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
	        str.push(typeof v == "object" ? 
	            serialize(v, k) :
	            encodeURIComponent(k) + "=" + encodeURIComponent(v));
	    }
	    return str.join("&");
	},
	getCoverArt: function(args){
		var data = Asub.API.baseArgs();
		if(args.coverArt){
			data.id = args.coverArt;
		}else if(args.id){
			data.id = args.id;	
		}
		
		if(args.size){
			data.size = args.size;
		}
		return Asub.server() + "/rest/getCoverArt.view?" + Asub.API.serialize(data);	
	},
	getAlbumList: function(args,callback){
		var data = Asub.API.baseArgs();
		if(args.listType) data.type = args.listType;
		if(args.size) data.size = args.size;
		if(args.offset) data.offset = args.offset;
		
		$.ajax({
			type: "GET",
			url: Asub.server() + "/rest/getAlbumList.view",
			data: data,
	        dataType: "jsonp",
	        crossDomain: true,
	        success: function(r){
	        	if(r['subsonic-response']) return callback(r['subsonic-response']);
	        	else Asub.error('Failed to get Folder Contents');
        	}
		});
	},
	search: function(args,callback){
		var data = Asub.API.baseArgs();
		if(args.artist) data.artist = args.artist;
		if(args.album) data.artistOffset = args.artistOffset;
		if(args.albumOffset) data.album = args.album;
		if(args.title) data.title = args.title;
		if(args.any) data.any = args.any;
		if(args.count) data.count = args.count;
		if(args.offset) data.offset = args.offset;
		if(args.newerThan) data.newerThan = args.newerThan;
				
		$.ajax({
			type: "GET",
			url: Asub.server() + "/rest/search.view",
			data: data,
	        dataType: "jsonp",
	        crossDomain: true,
	        success: function(r){
	        	if(r['subsonic-response']) return callback(r['subsonic-response']);
	        	else Asub.error('Failed to get Folder Contents');
        	}
		});
	},	
	search2: function(args,callback){
		var data = Asub.API.baseArgs();
		if(args.query) data.query = args.query;
		if(args.artistOffset) data.artistOffset = args.artistOffset;
		if(args.albumOffset) data.albumOffset = args.albumOffset;
		if(args.songOffset) data.songOffset = args.songOffset;
		//Count
		if(args.artistCount) data.artistCount = args.artistCount;
		if(args.albumCount) data.albumCount = args.albumCount;
		if(args.songCount) data.songCount = args.songCount;
				
		$.ajax({
			type: "GET",
			url: Asub.server() + "/rest/search2.view",
			data: data,
	        dataType: "jsonp",
	        crossDomain: true,
	        success: function(r){
	        	if(r['subsonic-response']) return callback(r['subsonic-response']);
	        	else Asub.error('Failed to get Folder Contents');
        	}
		});
	},	
	getChatMessages: function(args,callback){
		var data = Asub.API.baseArgs();
		if(args.since) data.since = args.since;
		
		$.ajax({
			type: "GET",
			url: Asub.server() + "/rest/getChatMessages.view",
			data: data,
	        dataType: "jsonp",
	        crossDomain: true,
	        success: function(r){
	        	if(r['subsonic-response']){
	        		return callback(r['subsonic-response']);
        		}else{
        			Asub.error('Failed to get Folder Contents');
    			}
        	}
		});
	},
	addChatMessage: function(args,callback){
		var data = Asub.API.baseArgs();
		data.message = args.message;
		
		$.ajax({
			type: "GET",
			url: Asub.server() + "/rest/addChatMessage.view",
			data: data,
	        dataType: "jsonp",
	        crossDomain: true,
	        success: function(r){
	        	if(r['subsonic-response']) return callback(r['subsonic-response']);
	        	else Asub.error('Failed to get Folder Contents');
        	}
		});
	},
};
