#!/usr/bin/env node


var png2lwxl = require('./lib/png2lwxl');
var fs = require('fs');


var imgPath = __dirname + '/test.png';
png2lwxl.convert(imgPath, {
	landscape: true,          // rotates image 90 degrees
	blackwhiteThreshold: 110  // 0-256: the higher the value, the more pixels will be treated as black
}, function (err, printData) {
	if(err) return console.log(err);
	console.log(printData);

	fs.writeFile(__dirname + '/test.prn', printData, function (err) {
		if(err) return console.log(err);
		console.log("file written");
	});
});

