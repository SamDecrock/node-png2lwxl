# node-png2lwxl
Node version of pbm2lwxl using png as input format. It takes a png as input file and spits out prn-file which can be sent to your label printer.

It is based pbm2lwxl.c written by Mark Whitis

## Install

You can install __png2lwxl__ using the Node Package Manager (npm):

    npm install png2lwxl

## Simple example
```js
var png2lwxl = require('png2lwxl');
var fs = require('fs');

png2lwxl.convert(imgPath, function (err, printData) {
    if(err) return console.log(err);

    fs.writeFile(__dirname + '/test.prn', printData, function (err) {
        if(err) return console.log(err);
        console.log("file written");
    });
});
```

Just send the test.prn file to your label printer as raw data.

Label printers can only print black or white, no grayscale, so I used a threshold value when sending color or gray pixels. The thresshold can be set using the ```blackwhiteThreshold```-option.

If you want to rotate your image 90 degrees, you can set the option ```landscape``` to true:

```js
var png2lwxl = require('png2lwxl');
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


```
