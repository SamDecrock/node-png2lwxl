#!/usr/bin/env node

var pngparse = require('pngparse');

function convertToBlackAndWhiteMatrixImage(image, options) {
	// convert image to matrix of pixels:
	var rows = [];

	for (var y = 0; y < image.height; y++) {
		var cols = [];
		for (var x = 0; x < image.width; x++) {
			var pos = x + image.width*y;


			pos = pos * image.channels;

			var pixel = 0; // white = 0, black = 1

			// console.log(image.data[pos], image.data[pos+1], image.data[pos+2], image.data[pos+3]);

			var threshold = options.blackwhiteThreshold;

			// 1 channel : grayscale
			// 2 channels: grayscale + alpha
			// 3 channels: RGB
			// 4 channels: RGBA
			switch(image.channels) {
				case 1:
				if(image.data[pos] < threshold) pixel = 1;
				break;

				case 2:
				var gray = image.data[pos] *  image.data[pos+1]/255;
				if(gray < threshold) pixel = 1;
				break;

				case 3:
				var gray = 0.21*image.data[pos] + 0.72*image.data[pos+1] + 0.07*image.data[pos+2];
				if(gray < threshold) pixel = 1;
				break;

				case 4:
				var gray = (0.21*image.data[pos] + 0.72*image.data[pos+1] + 0.07*image.data[pos+2]) * image.data[pos+3]/255;
				if(gray < threshold) pixel = 1;
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

function rotateMatrixImage(bwMatrixImage) {
	var rows = [];
	for (var x = 0; x < bwMatrixImage.width; x++) {
		var cols = [];
		for (var y = bwMatrixImage.height - 1; y >= 0; y--) {
			cols.push(bwMatrixImage.data[y][x]);
		}
		rows.push(cols);
	}

	var rotatedImage = {
		height: bwMatrixImage.width,
		width: bwMatrixImage.height,
		data: rows
	};

	return rotatedImage;
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


function convert(filename, options_callback, callback) {
	var options = null;

	var defaultOptions = {
		landscape: false,
		blackwhiteThreshold: 128
	};

	if(!callback) {
		callback = options_callback;
	}else{
		options = options_callback;
	}

	if(options == null) options = defaultOptions;
	if(!options.landscape) options.landscape = defaultOptions.landscape;
	if(!options.blackwhiteThreshold) options.blackwhiteThreshold = defaultOptions.blackwhiteThreshold;


	pngparse.parseFile(filename, function (err, img) {
		if(err) return callback(err);

		// image width cannot be more than 2048 pixels
		// can only store 256 bytes in a row with 8 pixels per byte so that's 2048 pixels
		if(!options.landscape) {
			if(img.width>2048) return callback(new Error('Width cannot be more than 2048 pixels'));
		}else{
			if(img.height>2048) return callback(new Error('height cannot be more than 2048 pixels'));
		}


		// convert to black and white pixel matrix image (pbm style):
		var bwMatrixImage = convertToBlackAndWhiteMatrixImage(img, options);


		if(options.landscape){
			bwMatrixImage = rotateMatrixImage(bwMatrixImage);
		}

		// convert to 'label image' or something that the label printer understands:
		var labelImage = convertImageToDotlabel(bwMatrixImage);

		return callback(null, labelImage);
	});
}

exports.convert = convert;



