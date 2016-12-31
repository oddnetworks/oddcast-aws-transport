'use strict';

const AWS = require('aws-sdk');

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION;

const QUEUE_URL = process.argv[2];

if (!AWS_ACCESS_KEY_ID) {
	throw new Error('Missing env var AWS_ACCESS_KEY_ID');
}
if (!AWS_SECRET_ACCESS_KEY) {
	throw new Error('Missing env var AWS_SECRET_ACCESS_KEY');
}
if (!AWS_REGION) {
	throw new Error('Missing env var AWS_REGION');
}
if (!QUEUE_URL) {
	throw new Error('missing argv for Queue URL');
}

const sqs = new AWS.SQS({
	apiVersion: '2012-11-05',
	region: AWS_REGION,
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET_ACCESS_KEY
});

const options = {
	QueueUrl: QUEUE_URL,
	MessageBody: JSON.stringify({rid: Math.round(Math.random() * 100)}),
	MessageAttributes: {
		pattern: {
			DataType: 'String',
			StringValue: JSON.stringify({role: 'scheduler'})
		}
	}
};

sqs.sendMessage(options, (err, res) => {
	if (err) {
		console.error(err.stack || err.message || err);
		return;
	}

	console.log(JSON.stringify(res, null, 2));
});

console.error('executed');

