'use strict';

const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {
	console.log('%s %s', req.method, req.url);

	Object.keys(req.headers).forEach(key => {
		console.log('%s: %s', key, req.headers[key]);
	});

	let postBody = '';
	req.setEncoding('utf8');

	req.on('data', data => {
		postBody += data;
	});

	req.on('end', () => {
		let data = null;
		try {
			data = JSON.parse(postBody);
		} catch (err) {
			console.log(`JSON parsing error: ${err.message}`);
		}

		process.stdout.write('\n');
		console.log(JSON.stringify(data, null, 2));
		process.stdout.write('\n');

		let promise;

		if (req.headers['x-amz-sns-message-type'] === 'SubscriptionConfirmation') {
			console.log('SubscriptionConfirmation SubscribeURL: %s', data.SubscribeURL);
			promise = sendSubscriptionConfirmation(data.SubscribeURL);
		} else if (req.headers['x-amz-sns-message-type'] === 'Notification') {
			console.log('Notification MessageId: %s', data.MessageId);
			promise = Promise.resolve(null);
		} else {
			console.log(`Unknown message type: "${req.headers['x-amz-sns-message-type']}"`);
			promise = Promise.resolve(null);
		}

		promise.then(() => {
			res.writeHead(200, {
				'Content-Type': 'text/plain',
				'Content-Length': '0'
			});

			res.end();
		}).catch(err => {
			console.error('ERROR:');
			console.error(err.stack || err.message || err);

			res.writeHead(500, {
				'Content-Type': 'text/plain',
				'Content-Length': '0'
			});

			res.end();
		});
	});
});

server.listen(8686, () => {
	const addr = server.address();
	console.log('server running on %s:%s', addr.address, addr.port);
});

function sendSubscriptionConfirmation(confirmationUrl) {
	const parsedUrl = url.parse(confirmationUrl);

	const params = {
		method: 'GET',
		protocol: parsedUrl.protocol,
		hostname: parsedUrl.hostname,
		path: parsedUrl.path
	};

	return new Promise((resolve, reject) => {
		const req = https.request(params, res => {
			console.log('Subscription confirmation response received.');
			resolve(res);
		});

		req.on('error', reject);

		req.end();
	});
}
