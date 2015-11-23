var AWS = require('aws-sdk');

// args.aws_access_key_id
// args.aws_secret_access_key
// args.region
exports.main = function () {
};

exports.createSNS = function (args) {
	return new AWS.SNS({
		accessKeyId: args.aws_access_key_id,
		secretAccessKey: args.aws_secret_access_key,
		apiVersion: '2010-03-31',
		region: args.region
	});
};

// args.topic_arn
// args.endpoint
// args.sns
exports.subscribe = function (args) {
	var options = {
		TopicArn: args,
		Protocol: 'http',
		Endpoint: args
	};

	args.sns.subscribe(options, function (err) {
		if (err && err.message === 'CrendentialsError') {
			console.error('Missing crendentials');
			return;
		}
		if (err) {
			console.error(err.stack || err.message || err);
			return;
		}
	});
};

if (require.main === module) {
	exports.main();
}
