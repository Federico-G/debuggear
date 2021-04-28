const functions = require('firebase-functions');
const path = require('path');
const fs = require('fs');
const vision = require('@google-cloud/vision');
const {v4 : uuidv4} = require('uuid');
const fetch = require("node-fetch");


const decodeImage = (imageBase64Code, filePath) => {
	if (!imageBase64Code) {
		throw Error("No base64 image to decode.");
	}

	imageBase64Code = imageBase64Code.replace(/^data:image\/jpeg;base64,/,"");
    const imageBinaryBuffer = Buffer.from(imageBase64Code, 'base64').toString('binary');

    if (!fs.existsSync(path.parse(filePath).dir)) {
    	fs.mkdir(path.parse(filePath).dir, {recursive: true}, error => {
    		if (error) {
				console.log("Error creating the directory");
    			throw error;
			}
		});
    }


    fs.writeFile(filePath, imageBinaryBuffer, "binary", error => {
        if (error) {
			console.log(`Error creating the file: ${error}`);
            throw error;
        } else {
            console.log('File created from base64 string!');
        }
    });
};


const convertPointAndSizeToBoundingArea = pointAndSize => {
	const boundingTopLeftX = Math.floor(pointAndSize.x);
	const boundingTopLeftY = Math.floor(pointAndSize.y);
	const width = Math.ceil(pointAndSize.width);
	const height = Math.ceil(pointAndSize.height);

	return [
		{x: boundingTopLeftX, y: boundingTopLeftY},
		{x: boundingTopLeftX + width, y: boundingTopLeftY},
		{x: boundingTopLeftX, y: boundingTopLeftY + height},
		{x: boundingTopLeftX + width, y: boundingTopLeftY + height},
	];
};


const isTextInBoundingArea = (boundingArea, textArea) => {
	const [boundingTopLeft, boundingTopRight, boundingBottomLeft, boundingBottomRight] = boundingArea
	const [textTopLeft, textTopRight, textBottomLeft, textBottomRight] = textArea

	return (
		textTopLeft.x >= boundingTopLeft.x && textTopLeft.y >= boundingTopLeft.y
		&& textBottomRight.x <= boundingBottomRight.x && textBottomRight.y <= boundingBottomRight.y
	);
};


const createStringsForBounds = (textDetections, bounds) => bounds.map(boundPointAndSize => {
	const boundingArea = convertPointAndSizeToBoundingArea(boundPointAndSize);

	let strings = [];

	textDetections.forEach(textDetection => {
		const textArea = textDetection.boundingPoly.vertices;
		const text = textDetection.description; 

		if (isTextInBoundingArea(boundingArea, textArea))
			strings.push(text);
	});

	return {
		...boundPointAndSize,
		text: strings.join(" "),
	};
});


const parseTextsIntoSchema = textDescription => {
	const texts = textDescription.split(/[\s,]+/).map(text => text.replace(/\W/g, '')).filter(text => text.length)
	const tableName = texts.reduce((textA, textB) => {
    	const uppercaseCharsInA = (textA.match(/[A-Z]/g) || []).length; 
    	const uppercaseRatioInA = (uppercaseCharsInA / textA.length);

    	const uppercaseCharsInB = (textB.match(/[A-Z]/g) || []).length; 
    	const uppercaseRatioInB = (uppercaseCharsInB / textB.length);

    	const isAMoreFittingAsTableName = (
        	(uppercaseRatioInA > uppercaseRatioInB) || 
        	((uppercaseRatioInA === uppercaseRatioInB) && uppercaseCharsInA > uppercaseCharsInB)
        )
        return isAMoreFittingAsTableName ? textA : textB;
    });

	return {
		name: tableName.toUpperCase(),
		fields: texts.filter(fieldCandidate => fieldCandidate !== tableName).map(field => field.toLowerCase())
	}
}


exports.recognizeText = functions.https.onRequest(async (request, response) => {
	response.set("Access-Control-Allow-Origin", "*");
  	response.set("Access-Control-Allow-Headers", "Content-Type");
  	response.set('Access-Control-Allow-Methods', 'POST');

  	console.log(`Payload for recognizeText: ${request.body}`);
  	body = JSON.parse(request.body);

    const requestId = uuidv4();
    try {
    	const filePath = path.join('/tmp/', `image-${requestId}.jpg`); 
		
		decodeImage(body.image, filePath);

        const visionClient = new vision.ImageAnnotatorClient();
        const [result] = await visionClient.documentTextDetection(filePath);
        const textDetections = result.textAnnotations;

        console.log(textDetections[0]);

        const results = createStringsForBounds(textDetections.slice(1), body.bounds);
		
		response.send(results);
    } catch (error) {
        console.log(`Request ID: ${requestId}\nError: ${error}\nStack: ${error.trace}`);
        response.status(500).send(error);
    }
});


exports.recognizeStatement = functions.https.onRequest(async (request, response) => {
	response.set("Access-Control-Allow-Origin", "*");
  	response.set("Access-Control-Allow-Headers", "Content-Type");
  	response.set('Access-Control-Allow-Methods', 'POST');

  	console.log(`Payload for recognizeStatement: ${request.body}`);
  	body = JSON.parse(request.body);

    const requestId = uuidv4();
    try {
    	const filePath = path.join('/tmp/', `image-${requestId}.jpg`); 
		
		decodeImage(body.image, filePath);

        const visionClient = new vision.ImageAnnotatorClient();
        const [result] = await visionClient.documentTextDetection(filePath);
        const statement = result.textAnnotations[0].description;

        console.log(statement);
		response.send(statement);
    } catch (error) {
        console.log(`Request ID: ${requestId}\nError: ${error}\nStack: ${error.trace}`);
        response.status(500).send(error);
    }
});


exports.recognizeSchema = functions.https.onRequest(async (request, response) => {
	response.set("Access-Control-Allow-Origin", "*");
  	response.set("Access-Control-Allow-Headers", "Content-Type");
  	response.set('Access-Control-Allow-Methods', 'POST');

  	console.log(`Payload for recognizeSchema: ${request.body}`);
  	body = JSON.parse(request.body);

    const requestId = uuidv4();
    try {
    	const filePath = path.join('/tmp/', `image-${requestId}.jpg`); 
		
		decodeImage(body.image, filePath);

        const visionClient = new vision.ImageAnnotatorClient();
        const [result] = await visionClient.documentTextDetection(filePath);
        const texts = result.textAnnotations[0].description;

        console.log(texts);

        const results = parseTextsIntoSchema(texts);

        console.log(results);
		response.send(results);
    } catch (error) {
        console.log(`Request ID: ${requestId}\nError: ${error}\nStack: ${error.trace}`);
        response.status(500).send(error);
    }
});


exports.getQueryDiagram = functions.https.onRequest(async (request, response) => {
	response.set("Access-Control-Allow-Origin", "*");
  	response.set("Access-Control-Allow-Headers", "Content-Type");
  	response.set('Access-Control-Allow-Methods', 'POST');

  	console.log(`Payload for getQueryDiagram: ${request.body}`);
    reqBody = JSON.parse(request.body);

    try {
        const queryVisPromise = await fetch(reqBody.url);
        const queryVisResponse = await queryVisPromise.text();

        console.log(queryVisResponse);

        const imageResponse = await fetch(queryVisResponse);
	    const imageData = await imageResponse.buffer();
	    const encodedImage = imageData.toString('base64');

		response.send(encodedImage);
    } catch (error) {
        console.log(`Error: ${error}\nStack: ${error.trace}`);
        response.status(500).send(error);
    }
});

