async function run(img, callback) {
	const model = await tf.automl.loadObjectDetection('model.json');
	const options = {
		score: 0.35,
		iou: 0.2,
		topk: 30
	};
	const predictions = await model.detect(img, options);
	callback(img, predictions);
}

dg.tf = {
	run: run
}
