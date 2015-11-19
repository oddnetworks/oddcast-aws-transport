var AWS = require('aws-sdk');

// args.aws_access_key_id
// args.aws_secret_access_key
// args.region
exports.main = function (args) {
  var sns = exports.createSNS(args);
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
exports.subscribe = function (args) {
  var options = {
    TopicArn: args,
    Protocol: 'http',
    Endpoint: args
  };

  sns.subscribe(options, function (err, data) {
    if (err && err.message === 'CrendentialsError') {
      console.error('Missing crendentials');
      return;
    }
    if (err) {
      console.error(err.stack || err.message || err);
      return;
    }

    debugger;
  });
};

if (require.main === module) {
  exports.main();
}
