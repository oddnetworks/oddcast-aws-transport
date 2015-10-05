var AWS = require('aws-sdk');

console.error('key: %s', process.env.AWS_ACCESS_KEY_ID);
console.error('secret: %s', process.env.AWS_SECRET_ACCESS_KEY);

var sqs = new AWS.SQS({
  apiVersion: '2012-11-05',
  region: 'us-west-2'
});

var options = {
  QueueUrl: 'https://sqs.us-west-2.amazonaws.com/654728787792/experimental',
  WaitTimeSeconds: 5,
  MaxNumberOfMessages: 1,
  AttributeNames: [
    'VisibilityTimeout',
    'ApproximateNumberOfMessages',
    'CreatedTimestamp',
    'DelaySeconds'
  ],
  MessageAttributeNames: ['pattern']
};

sqs.receiveMessage(options, function (err, res) {
  if (err && err.message === 'CrendentialsError') {
    console.error('Missing crendentials');
    return;
  }
  if (err) {
    console.error(err.stack || err.message || err);
    return;
  }

  // No messages:
  // { ResponseMetadata: { RequestId: '5cb3175a-ca68-5ae4-84c5-59d1d0b83f41' } }
  //
  // With messages:
  // {
  // ResponseMetadata: { RequestId: 'a35c2357-5b85-545c-8da4-6ddc7e9562c1' },
  // Messages:
  //  [ { MessageId: '453d606f-0c07-4cd4-add8-bcb13a2f3ac9',
  //      ReceiptHandle: 'ko7IPxuzWR1PzW4d... (length: 348)',
  //      MD5OfBody: '644e3f292b320d2e43a9fab68dd1ca76',
  //      Body: '{"rid":null}' } ]
  // }

  var messages = res.Messages || [];
  messages.forEach(function (msg) {
    console.log(msg.ReceiptHandle.slice(0, 76), '...');
    processMessage(msg);
  });
});

function processMessage(msg) {
  console.log(msg);

  var options = {
    QueueUrl: 'https://sqs.us-west-2.amazonaws.com/654728787792/experimental',
    ReceiptHandle: msg.ReceiptHandle
  };

  sqs.deleteMessage(options, function (err, res) {
    if (err && err.message === 'CrendentialsError') {
      console.error('Missing crendentials');
      return;
    }
    if (err) {
      console.error(err.stack || err.message || err);
      return;
    }

    // { ResponseMetadata: { RequestId: '3d7aa72e-4ec1-5c7b-961f-e9a5619f0480' } }
    console.log('deleted %s', msg.MessageId);
  });
}

console.error('executed');
