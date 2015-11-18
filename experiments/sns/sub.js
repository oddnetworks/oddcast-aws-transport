var AWS = require('aws-sdk');

console.error('key: %s', process.env.AWS_ACCESS_KEY_ID);
console.error('secret: %s', process.env.AWS_SECRET_ACCESS_KEY);

var sns = new AWS.SNS({
  apiVersion: '2010-03-31',
  region: 'us-west-2'
});

function subscribe() {
  var options = {
    TopicArn: '',
    Protocol: 'http',
    Endpoint: ''
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
}
