'use strict';

const test = require('tape');
const sinon = require('sinon');
const oddcast = require('oddcast');
const awsTransport = require('../lib/oddcast-aws-transport');

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

(function commandOriginatedMessage() {
	const paylaod = {
		id: '123'
	};

	const readTransport = awsTransport.sqsCommandListener({
		queueUrl: QUEUE_URL,
		region: REGION,
		accessKeyId: ACCESS_KEY_ID,
		secretAccessKey: SECRET_ACCESS_KEY
	});

	const writeTransport = awsTransport.sqsCommandEmitter({
		queueUrl: QUEUE_URL,
		region: REGION,
		accessKeyId: ACCESS_KEY_ID,
		secretAccessKey: SECRET_ACCESS_KEY
	});

	const receiveChannel = oddcast.commandChannel();
	const sendChannel = oddcast.commandChannel();

	const readErrorHandler = sinon.spy();
	const writeErrorHandler = sinon.spy();

	const messageHandler = sinon.spy();

	test('before all commandOriginatedMessage', function (t) {
		readTransport.on('error', readErrorHandler);
		writeTransport.on('error', writeErrorHandler);

		readTransport.on('error', function () {
			t.end();
		});
		writeTransport.on('error', function () {
			t.end();
		});
		readTransport.on('message:deleted', function () {
			t.end();
		});

		receiveChannel.use({role: 'test'}, readTransport);
		sendChannel.use({role: 'test'}, writeTransport);

		// Setup the receive handler.
		receiveChannel.receive({role: 'test'}, messageHandler);

		// Send the command.
		sendChannel.send({role: 'test', cmd: 'command:message'}, paylaod);
	});

	test('read error handler is not called', function (t) {
		t.plan(1);
		t.equal(readErrorHandler.callCount, 0);
	});

	test('write error handler is not called', function (t) {
		t.plan(1);
		t.equal(writeErrorHandler.callCount, 0);
	});

	test('after all commandOriginatedMessage', function (t) {
		readTransport.close();
		t.end();
	});
})();
