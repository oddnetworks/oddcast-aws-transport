const AWS = require('aws-sdk');

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION;

const TOPIC_ARN = process.argv[2];

if (!AWS_ACCESS_KEY_ID) {
	throw new Error('Missing env var AWS_ACCESS_KEY_ID');
}
if (!AWS_SECRET_ACCESS_KEY) {
	throw new Error('Missing env var AWS_SECRET_ACCESS_KEY');
}
if (!AWS_REGION) {
	throw new Error('Missing env var AWS_REGION');
}
if (!TOPIC_ARN) {
	throw new Error('missing argv for topic ARN');
}

const sns = new AWS.SNS({
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET_ACCESS_KEY,
	apiVersion: '2010-03-31',
	region: AWS_REGION
});

const params = {
	TopicArn: TOPIC_ARN,
	Message: JSON.stringify({foo: 'bar', timestamp: Date.now()}),
	MessageAttributes: {
		pattern: {
			DataType: 'String',
			StringValue: JSON.stringify({role: 'messages'})
		}
	}
};

sns.publish(params, (err, data) => {
	if (err) {
		console.log('Response Error:');
		console.log(err.stack || err.message || err);
	} else {
		console.log('Subscription Sent to %s %s', params.TopicArn, params.Endpoint);
		console.log(JSON.stringify(data, null, 2));
		// {
		//   "ResponseMetadata": {
		//     "RequestId": "b39e9d8e-bf22-5405-b82a-cd5085413d37"
		//   },
		//   "MessageId": "319a7f8f-d960-51d7-b69f-2f51e303c8e5"
		// }
	}
});
