var _=require("underscore"),
	config=require("./config.json"),
	nodemailer = require('nodemailer'),
	smtpTransport = require('nodemailer-smtp-transport');


var transport = nodemailer.createTransport(smtpTransport({
    host:config.host,
    debug:true,
    port:2225,
    debug:true,
    auth: {
        user: config.user,
        pass: config.pass
    }
}));

function notify(data){
	mailOptions = _(data).defaults({from:"EESTEC-BOT <sys@eestec.hu>"});
	//console.log(mailOptions)
	transport.sendMail(mailOptions, function(error, info){
	    if(error){
	        console.log(error);
	    }else{
	        console.log('Message sent: ' + info.response);
	    }
	});
}

var messages=[];
var eestec_24h={

	mail:function(msg){
		messages.push(msg);
		_.debounce(eestec_24h.done,500);
	},
	done:function(){
		var time_now=+new Date();
		var time_1h=time_now-3600000;
		var time_24h=time_now-86400000;
		//leválogatjuk a különböző témájú leveket
		var m=messages;
		m=_(m).each(function(msg){msg.head.subject=(msg.head.subject+"").replace(/Re: |Fw: /,"")})
		m=_(m).filter(function(msg){return msg.head.subject.match("[24h]");})
		m=_(m).sortBy(function(msg){return +msg.attributes.date;})
		m=_(m).groupBy(function(msg){return msg.head.subject;})

		//a threadeket egyesével kielemezzük
		_(m).each(function(thread){
			var first=_(thread).min(function(msg){return +msg.attributes.date});
			var last=_(thread).max(function(msg){return +msg.attributes.date});
			if(_(thread).any(function(msg){return msg.head["x-parsed"]+"".match(/24h/);}))
				return;
			if(+first.attributes.date<time_24h && +last.attributes.date<time_1h){
				var to=""+_(thread).reduce(function(x,msg){return msg.head.from + ", " + msg.head.to+", "+msg.head.cc+", "+x},"<sys@eestec.hu>, ");
				to=_(to.match(/<(.*?)>/g)).uniq().join(", ");
				console.log("sending notification: ",last.head.subject);
				notify({
					subject:"Re: "+last.head.subject,
					to:to,
					headers:{
						"X-PARSED":"24h",
						"In-Reply-To":last.head["message-id"],
						"References":_(thread).map(function(msg){return msg.head["message-id"].join("")})
					},
					text:"A levélre adott 24 órás határidő lejárt, és egy órája nem történt aktivitás."
				});
			}
		})

	}
}
exports.eestec_24h=eestec_24h;







exports.eestec_crm={

	mail:function(msg){
		var to=_((""+msg.head.from + ", " + msg.head.to+", "+msg.head.cc).match(/<.*?>/g)).uniq();

		//ha valami okból privát a levelezés, akkor nem tesszük ki
		if(_(to).contains("<board@eestec.hu>") || (msg.head.subject+"").match("/private|privát|titkos|titok|személyes|secret/")){
			return;
		}

		//TODO: crm-ben kikeressük a címzett usereket

	}
};

exports.test={
	mail:function(msg){
		if(msg.head.subject.join("").match(/\[TEST-RCV\]/)){
			var to=msg.head.from+"";
			to=_(to.match(/<(.*?)>/g)).uniq().join(", ");
			console.log("sending notification: ",msg.head.subject);
			notify({
				subject:"Re: "+msg.head.subject,
				to:to,
				headers:{
					"X-PARSED":"24h",
					"In-Reply-To":msg.head["message-id"],
					"References":msg.head["message-id"].join("")
				},
				text:"Everything is awesome."
			});
		}
	}
};

