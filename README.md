# [Asybnonymous](https://github.com/analogrithems/asubnonymous)

HTML5 frontend for (http://Subsonic.org) using Knockoutjs & Bootstrap


## Quick start

1. Checkout the code 
2. Place in a webaccessable directory
3. Call it with you browser (I.E. http://demo.com/asubnonymous )
4. Login

## Screen Shots
![Add to Playlist](/../master/screen%20shot%205.png?raw=true "Add to Playlist")
![Play Media](/../master/screen%20shot%204.png?raw=true "Play Media")
![Playlist](/../master/screen%20shot%203.png?raw=true "Playlist")
![Front Page](/../master/screen%20shot%202.png?raw=true "Front Page")
![Chat Screen](/../master/screen%20shot%201.png?raw=true "Chat Window")


## Webm Support (Chrome / Firefox)
The Asub player prefers to deliver content natively. Although with the current state of the web this is hard.  
Also with the default setup of subsonic this isn't always possible.  So inorder to get asub to deliver webm for native
support in Chrome and Firefox you need to add the webm transcoding config to your subsonic server.

 (from) avi mpg mpeg mp4 m4v mkv mov wmv ogv divx m2ts
 (to) webm
 (transcoder) ffmpeg -ss %o -t %d -i %s -async 1 -vf lutyuv=y=val*1.3 -b %bk -s %wx%h -ar 44100 -ac 2 -v 0 -f webm -vcodec libvpx -preset superfast -acodec libvorbis -threads 0 -

Then asub will not have to result to using the flash based player for Firefox and Chrome

## HLS Support / Mobile Video for iOS
This is now possilbe, Also as far as I know this is currently the only Subsonic client that can server video to 
* iPhone
* iPad
* iPod
* Android

## Flash / SilverLight Fallforward
If you browser has Flash or Silverlight support and can't use HLS, or WebM.  Asub will detect this and 
load you the flash based player.  This is really just geared towards I.E. users because streaming Mp4(h.264) isn't easy or pretty with FFMpeg
