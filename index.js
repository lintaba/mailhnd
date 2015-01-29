
var App=require("./app").App,
	config=require("./config.json")
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0


var app=new App(config);


app.addParser(require("./parsers").eestec_24h);
app.addParser(require("./parsers").eestec_crm);
app.addParser(require("./parsers").test);
app.fetch();
setInterval(app.fetch,5000);


