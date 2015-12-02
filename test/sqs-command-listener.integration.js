'use strict';

const test = require('tape');
const sinon = require('sinon');
const oddcast = require('oddcast');
const awsTransport = require('../lib/');

const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
const REGION = process.env.REGION;
const TOPIC_ARN = process.env.TOPIC_ARN;
const QUEUE_URL = process.env.QUEUE_URL;

if (!ACCESS_KEY_ID) {
	console.error('ACCESS_KEY_ID env variable is required.');
	process.exit(1);
}
if (!SECRET_ACCESS_KEY) {
	console.error('SECRET_ACCESS_KEY env variable is required.');
	process.exit(1);
}
if (!REGION) {
	console.error('REGION env variable is required.');
	process.exit(1);
}
if (!TOPIC_ARN) {
	console.error('TOPIC_ARN env variable is required.');
	process.exit(1);
}
if (!QUEUE_URL) {
	console.error('QUEUE_URL env variable is required.');
	process.exit(1);
}

(function eventsToQueue() {
	const broadcaster = oddcast.eventChannel();
	const queueA = oddcast.commandChannel();
	const queueB = oddcast.commandChannel();

	const broadcastEmitter = awsTransport.snsBroadcastEmitter({
		topicArn: TOPIC_ARN,
		region: REGION,
		accessKeyId: ACCESS_KEY_ID,
		secretAccessKey: SECRET_ACCESS_KEY
	});

	const commandListener = awsTransport.sqsCommandListener({
		queueURL: QUEUE_URL,
		region: REGION,
		accessKeyId: ACCESS_KEY_ID,
		secretAccessKey: SECRET_ACCESS_KEY
	});

	broadcaster.use({role: 'stateChange'}, broadcastEmitter);
	queueA.use({role: 'stateChange', type: 'Players'}, commandListener);
	queueB.use({role: 'stateChange', type: 'Topics'}, commandListener);

	const onUpdate = sinon.spy();
	const onDelete = sinon.spy();

	test('before eventsToQueue', function (t) {
		let callCount = 0;

		// End the test setup once we have a total of 4 callbacks
		function onStateChange() {
			callCount += 1;
			if (callCount >= 4) {
				t.end();
			}
		}
		queueA.receive({role: 'stateChange'}, onStateChange);
		queueB.receive({role: 'stateChange'}, onStateChange);

		queueA.receive({operation: 'update'}, onUpdate);
		queueA.receive({operation: 'delete'}, onDelete);
		queueB.receive({operation: 'update'}, onUpdate);
		queueB.receive({operation: 'delete'}, onDelete);
	});
})();
