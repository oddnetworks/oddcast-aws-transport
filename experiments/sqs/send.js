var AWS = require('aws-sdk');

console.error('key: %s', process.env.AWS_ACCESS_KEY_ID);
console.error('secret: %s', process.env.AWS_SECRET_ACCESS_KEY);

var sqs = new AWS.SQS({
	apiVersion: '2012-11-05',
	region: 'us-west-2'
});

var options = {
	QueueUrl: 'https://sqs.us-west-2.amazonaws.com/654728787792/experimental',
	MessageBody: JSON.stringify({rid: Math.round(Math.random() * 100)}),
	MessageAttributes: {
		pattern: {
			DataType: 'String',
			StringValue: JSON.stringify({channel: 'command'})
		}
	}
};

sqs.sendMessage(options, function (err, res) {
	if (err && err.message === 'CrendentialsError') {
		console.error('Missing crendentials');
		return;
	}
	if (err) {
		console.error(err.stack || err.message || err);
		return;
	}

	// res
	// {
	//   MessageId: '453d606f-0c07-4cd4-add8-bcb13a2f3ac9',
	//   ResponseMetadata: { RequestId: 'f924d2dc-46a6-5a45-a7de-9c576209f95e' },
	//   MD5OfMessageBody: '644e3f292b320d2e43a9fab68dd1ca76',
	//   MD5OfMessageAttributes: 'cc973e8dfa259baf3369663dce9acbc2'
	// }

	console.log(res.MessageId);
});

console.error('executed');

