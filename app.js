var Imap = require('imap'),
    inspect = require('util').inspect;

var App=function(config){
	var busy=false;
	var latest=0;
	var config={
		user: config.user,
		password: config.pass,
		host: config.host,
		port: 143,
		tls: false
	}
	var parsers=[];
	this.addParser=function(fn){
		parsers.push(fn);
	}
	var imap = new Imap(config);
	function fetch(){
		console.log("fetching")
		imap.openBox('INBOX', true, function(err, box) {
		    if (err) throw err;
		    var f = imap.seq.fetch(latest+1+':*', { bodies: 'HEADER'});
		    f.on('message', function(msg, seqno) {
				var m={seqno:seqno};
				latest=seqno;
				msg.on('body', function(stream, info) {
					var buffer = '';
					stream.on('data', function(chunk) {buffer += chunk.toString('utf8');});
					stream.once('end', function() {m.head = Imap.parseHeader(buffer)});
				});
				msg.once('attributes', function(attrs) {m.attributes=attrs;});
				msg.once('end', function() {
					m.action=false;
					for(var i=0;i<parsers.length;++i)
						if(typeof parsers[i].mail=="function")
							parsers[i].mail(m);
				});
		    });
		    f.once('error', function(err) {console.log('Fetch error: ' + err);});
		    f.once('end', function() {
					for(var i=0;i<parsers.length;++i)
						if(typeof parsers[i].done=="function")
							parsers[i].done();
		    });
		});
	}
	imap.on('ready',  fetch);
	imap.on('message',fetch);
	imap.on('update',fetch);

	imap.on('error', function(err) {console.log(err);});
	imap.on('end', function() {console.log('Connection ended');busy=false;});

	this.fetch=function(){
		if(!busy){
			busy=true;
			imap.connect();
		}else{
			fetch();
		}
	}
}
exports.App=App;


return App;
