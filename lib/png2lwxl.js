#!/usr/bin/env node

var floydSteinberg = require('floyd-steinberg');
var pngparse = require('pngparse');


function convertToBlackAndWhiteMatrixImage(image) {
	// convert image to matrix of pixels:
	var rows = [];

	for (var y = 0; y < image.height; y++) {
		var cols = [];
		for (var x = 0; x < image.width; x++) {
			var pos = x + image.width*y;



			pos = pos * image.channels;

			var pixel = 0; // white = 0, black = 1

			// console.log(image.data[pos], image.data[pos+1], image.data[pos+2], image.data[pos+3]);

			// 1 channel : grayscale
			// 2 channels: grayscale + alpha
			// 3 channels: RGB
			// 4 channels: RGBA
			switch(image.channels) {
				case 1:
				if(image.data[pos] == 0) pixel = 1;
				break;

				case 2:
				if(image.data[pos] == 0 && image.data[pos+1] == 255) pixel = 1;
				break;

				case 3:
				if(image.data[pos] == 0 && image.data[pos+1] == 0 && image.data[pos+2] == 0) pixel = 1;
				break;

				case 4:
				if(image.data[pos] == 0 && image.data[pos+1] == 0 && image.data[pos+2] == 0 && image.data[pos+3] == 255) pixel = 1;
				break;
			}

			cols.push(pixel);
		}
		rows.push(cols);
	}

	var matrixImage = {
		height: image.height,
		width: image.width,
		data: rows
	};

	return matrixImage;
}

function convertImageToDotlabel(bwMatrixImage) {
	// this is based on pbm2lwxl.c written by by Mark Whitis
	// source code available from https://github.com/jfuchs/receipt-printy/blob/master/pbm2lwxl.c

	var pixel_order= [0x80,0x40,0x20,0x10,0x08,0x04,0x02,0x01];

	// each pixel will be stored in a bit, 8 bits fit inside a byte. So 8 pixels fit inside a byte.
	// for example, if we have 9 pixels, we will need 2 bytes.
	// 11111111 1 <== 9 black pixels, will fit inside 2 bytes
	// 0000000    <== 7 white pixels, will fit inside 1 byte
	var pixelBytesPerRow = Math.ceil(bwMatrixImage.width/8);

	// each row starts with "<ESC> D n <syn>", that's 4 bytes per row extra
	// n being the number of bytes containing pixeldata
	var bytesPerRow = pixelBytesPerRow + 4;

	var dataArray = [];
	for (var y = 0; y < bwMatrixImage.height; y++) {

		var rowBuffer = new Buffer(bytesPerRow);
		rowBuffer.fill(0x00);

		// begin every line with "<ESC> D n <syn>":
		// where n = number of bytes wide

		rowBuffer[0] = 27;   // <ESC>
		rowBuffer[1] = 0x44; // 'D'
		rowBuffer[2] = pixelBytesPerRow;
		rowBuffer[3] = 0x16; // <syn>

		for (var x = 0; x < bwMatrixImage.width; x++) {
			if(bwMatrixImage.data[y][x] == 1) {
				rowBuffer[4 + (x>>3)] |= pixel_order[x&0x07];
			}else{
				rowBuffer[4 + (x>>3)] &= ~pixel_order[x&0x07];
			}
		}

		dataArray.push(rowBuffer);
	}

	// end label with a form feed <ESC> E:
	var formfeed = new Buffer(2);
	formfeed[0] = 27;   // <ESC>
	formfeed[1] = 0x45; // 'E'
	dataArray.push(formfeed);

	// concat all buffers
	var data = Buffer.concat(dataArray);

	return data;
}


function convert(filename, ditherOrCallback, callback) {
	var dither = true;
	if(callback === undefined) {
		callback = ditherOrCallback;
	}else{
		dither = ditherOrCallback;
	}

	pngparse.parseFile(filename, function (err, img) {
		if(err) return callback(err);

		// image width cannot be more than 2048 pixels
		// can only store 256 bytes in a row with 8 pixels per byte so that's 2048 pixels
		if(img.width>2048) return callback(new Error('Width cannot be more than 2048 pixels'));

		// dither image:
		if(dither)
			floydSteinberg(img);

		// convert to black and white pixel matrix image (pbm style):
		var bwMatrixImage = convertToBlackAndWhiteMatrixImage(img);

		// convert to 'label image' or something that the label printer understands:
		var labelImage = convertImageToDotlabel(bwMatrixImage);

		return callback(null, labelImage);
	});
}

exports.convert = convert;



