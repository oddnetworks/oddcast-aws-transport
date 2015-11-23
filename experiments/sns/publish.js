var AWS = require('aws-sdk');

console.error('key: %s', process.env.AWS_ACCESS_KEY_ID);
console.error('secret: %s', process.env.AWS_SECRET_ACCESS_KEY);

var sns = new AWS.SNS({
	apiVersion: '2010-03-31',
	region: 'us-west-2'
});

var params = {
	TopicArn: 'arn:aws:sns:us-west-2:654728787792:r-and-d-events-transport',
	Message: JSON.stringify({foo: 'bar'}),
	MessageAttributes: {
		pattern: {
			DataType: 'String',
			StringValue: JSON.stringify({role: 'logging'})
		}
	}
};

sns.publish(params, function (err) {
	if (err) {
		console.error(err.stack || err.message || err);
	}
	// data
	// { MessageId: '8a0ba019-e563-5ab0-835e-eed2c72c12a6',
	//   ResponseMetadata: { RequestId: 'f656981e-f7e0-5b58-9fbf-d6d5d5af234e' }
	// }
});
