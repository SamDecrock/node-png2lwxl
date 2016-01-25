#!/usr/bin/env node


var png2lwxl = require('./lib/png2lwxl');
fs = require('fs');


var imgPath = __dirname + '/test.png';
png2lwxl.convert(imgPath, false, function (err, printData) {
	if(err) return console.log(err);
	console.log(printData);

	fs.writeFile(__dirname + '/test.prn', printData, function (err) {
		if(err) return console.log(err);
		console.log("file written");
	});
});

