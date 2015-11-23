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
		// Subscription Confirmation
		// -------------------------
		// POST /
		// x-amz-sns-message-type: SubscriptionConfirmation
		// x-amz-sns-message-id: 484a205d-dbbb-47aa-8c86-2f0851c68448
		// x-amz-sns-topic-arn: arn:aws:sns:us-west-2:654728787792:r-and-d-events-transport
		// content-length: 1623
		// content-type: text/plain; charset=UTF-8
		// host: 104.131.79.48:8686
		// connection: Keep-Alive
		// user-agent: Amazon Simple Notification Service Agent
		// accept-encoding: gzip,deflate
		//
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
		//
		// Notification
		// ------------
		// POST /
		// x-amz-sns-message-type: Notification
		// x-amz-sns-message-id: be0e65e9-4ce9-5d94-a568-2b20a0c94fad
		// x-amz-sns-topic-arn: arn:aws:sns:us-west-2:654728787792:r-and-d-events-transport
		// x-amz-sns-subscription-arn: arn:aws:sns:us-west-2:654728787792:r-and-d-events-transport:c76cdc62-af47-4ee6-85d1-733757602152
		// content-length: 1048
		// content-type: text/plain; charset=UTF-8
		// host: 104.131.79.48:8686
		// connection: Keep-Alive
		// user-agent: Amazon Simple Notification Service Agent
		// accept-encoding: gzip,deflate
		//
		// { Type: 'Notification',
		//   MessageId: '027af643-4d1a-5d24-aecd-b88aa16fa962',
		//   TopicArn: 'arn:aws:sns:us-west-2:654728787792:r-and-d-events-transport',
		//   Message: '{"foo":"bar"}',
		//   Timestamp: '2015-11-21T03:51:17.173Z',
		//   SignatureVersion: '1',
		//   Signature: 'Gg2Qp/hLPT2zJfzdkIbqS40JC1jl5crDhyq8P5YW39DlT8V/KE6VH1xHGjDwF4XrGmMj3FqtfaMwp+6z... (length: 344)',
		//   SigningCertURL: 'https://sns.us-west-2.amazonaws.com/SimpleNotificationService-bb750dd426d95ee939... (length: 98)',
		//   UnsubscribeURL: 'https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:... (length: 168)',
		//   MessageAttributes: { pattern: { Type: 'String', Value: '{"role":"logging"}' } }
		// }
		var data = JSON.parse(postBody);
		if (data.Type === 'SubscriptionConfirmation') {
			console.log('Token: %s', data.Token);
			console.log('SubscribeURL: %s', data.SubscribeURL);
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
