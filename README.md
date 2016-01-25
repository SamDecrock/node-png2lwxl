# node-png2lwxl
Node version of pbm2lwxl using png as input format. It takes a png as input file and spits out prn file which can be sent to your label printer.

It is based pbm2lwxl.c written by Mark Whitis

## Install

You can install __png2lwxl__ using the Node Package Manager (npm):

    npm install png2lwxl

## Simple example
```js
var png2lwxl = require('png2lwxl');

png2lwxl.convert(imgPath, function (err, printData) {
    if(err) return console.log(err);

    fs.writeFile(__dirname + '/test.prn', printData, function (err) {
        if(err) return console.log(err);
        console.log("file written");
    });
});
```

Just send the test.prn file to your label printer as raw data.

Label printers can only print black or white, no grayscale, so I used a dithering module. It's always on and can be disabled by adding a second argument to the ```convert()```-function:

```js
var png2lwxl = require('png2lwxl');

png2lwxl.convert(imgPath, false /* no dithering */, function (err, printData) {
    if(err) return console.log(err);

    fs.writeFile(__dirname + '/test.prn', printData, function (err) {
        if(err) return console.log(err);
        console.log("file written");
    });
});
```

Only pure black pixels will be printed, other pixels (gray or colored ones) will not be printed.