var http = require('http');

var server = http.createServer(function (req, res) {
  console.log('%s %s', req.method, req.url);
  Object.keys(req.headers).forEach(function (key) {
    console.log('%s: %s', key, req.headers[key]);
  });

  var postBody = '';
  req.setEncoding('utf8');
  req.on('data', function (data) {
    postBody += data;
  });
  req.on('end', function () {
    var data = JSON.parse(postBody);
    // Responds with something like this for a subscription confirmation:
    // { Type: 'SubscriptionConfirmation',
    //   MessageId: '15ef38e5-f1f5-479d-847a-caf1bee9455f',
    //   Token: '2336412f3... (length: 256)',
    //   TopicArn: 'arn:aws:sns:us-west-2:654728787...',
    //   Message: 'You have chosen to subscribe to the topic arn:aws:s... (length: 180)',
    //   SubscribeURL: 'https://sns.us-west-2.amazonaws.com/?Action=Co... (length: 395)',
    //   Timestamp: '2015-11-18T21:35:16.047Z',
    //   SignatureVersion: '1',
    //   Signature: 'Udh/afAi8uqADP/d7JgH+Wya/M8hetBTbh6CMuzHt3dwbZe1q... (length: 344)',
    //   SigningCertURL: 'https://sns.us-west-2.amazonaws.com/SimpleN... (length: 98)'
    // }
    if (data.Type === 'SubscriptionConfirmation') {
      console.log('Token: %s', data.Token);
      console.log('SubscribeURL: %s', data.SubscribeURL)
    }
  });

  var body = 'hello world!';
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Length': Buffer.byteLength(body).toString()
  });
  res.end(body);
});

server.listen(8686, function () {
  var addr = server.address();
  console.log('server running on %s:%s', addr.address, addr.port);
});