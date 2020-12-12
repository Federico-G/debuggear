function recognizeText(predictioni, imageSrc) {
	Tesseract.recognize(
		imageSrc,
		'spa+eng' // check
	).then(({
		data: {
			text
		}
	}) => {
		console.log(text);
		console.log(imageSrc);
	})
}

function recognizeMultipleTextFromImage(predictions) {
	for (var i = 0; i < predictions.length; i++) {
		var box = predictions[i].box;
		cropImage(document.getElementById("img").src, box.left, box.top, box.width, box.height, function(image) {
			recognizeText(predictions[i], image);
		});
	}
}


function cropImage(base64Src, x, y, width, height, callback) {
	var canvas = document.createElement('canvas');
	canvas.style.display = "none";
	canvas.width = width;
	canvas.height = height;
	document.body.appendChild(canvas);

	var context = canvas.getContext('2d');
	var imageObj = new Image();

	imageObj.onload = function() {
		context.drawImage(imageObj, x, y, width, height, 0, 0, width, height);

		callback(canvas.toDataURL());
		canvas.remove();
	};
	imageObj.src = base64Src;
}
