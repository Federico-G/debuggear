async function run(img, callback) {
	const model = await tf.automl.loadObjectDetection('model.json');
	const options = {
		score: 0.5,
		iou: 0.5,
		topk: 20
	};
	const predictions = await model.detect(img, options);
	callback(img, predictions);
}

dg.tf = {
	run: run
}
