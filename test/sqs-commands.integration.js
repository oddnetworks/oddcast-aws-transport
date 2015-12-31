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
		id: 'command_success'
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
	const messageDeletedHandler = sinon.spy();

	test('before all commandOriginatedMessage', function (t) {
		readTransport.on('error', readErrorHandler);
		writeTransport.on('error', writeErrorHandler);

		readTransport.on('error', function () {
			t.end();
		});
		writeTransport.on('error', function () {
			t.end();
		});

		readTransport.on('message:deleted', messageDeletedHandler);
		readTransport.on('message:deleted', function () {
			readTransport.close();
		});

		receiveChannel.use({role: 'test'}, readTransport);
		sendChannel.use({role: 'test'}, writeTransport);

		// Setup the receive handler.
		receiveChannel.receive({role: 'test', cmd: 'command:message'}, messageHandler);

		readTransport.on('close', function () {
			t.end();
		});

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

	test('got message paylaod', function (t) {
		t.plan(2);
		const args = messageHandler.args[0][0];
		t.ok(typeof paylaod.id !== 'undefined', 'paylaod is present');
		t.equal(args.id, paylaod.id);
	});

	test('message:deleted is called only once', function (t) {
		t.plan(1);
		t.equal(messageDeletedHandler.callCount, 1);
	});
})();

(function eventOriginatedMessage() {
	const paylaod = {
		id: 'event_success'
	};

	const readTransport = awsTransport.sqsCommandListener({
		queueUrl: QUEUE_URL,
		region: REGION,
		accessKeyId: ACCESS_KEY_ID,
		secretAccessKey: SECRET_ACCESS_KEY
	});

	const writeTransport = awsTransport.snsBroadcastEmitter({
		topicArn: TOPIC_ARN,
		region: REGION,
		accessKeyId: ACCESS_KEY_ID,
		secretAccessKey: SECRET_ACCESS_KEY
	});

	const receiveChannel = oddcast.commandChannel();
	const broadcastChannel = oddcast.commandChannel();

	const readErrorHandler = sinon.spy();
	const writeErrorHandler = sinon.spy();

	const messageHandler = sinon.spy();
	const messageDeletedHandler = sinon.spy();

	test('before all eventOriginatedMessage', function (t) {
		readTransport.on('error', readErrorHandler);
		writeTransport.on('error', writeErrorHandler);

		readTransport.on('error', function () {
			t.end();
		});
		writeTransport.on('error', function () {
			t.end();
		});

		readTransport.on('message:deleted', messageDeletedHandler);
		readTransport.on('message:deleted', function () {
			readTransport.close();
		});

		receiveChannel.use({role: 'test'}, readTransport);
		broadcastChannel.use({role: 'test'}, writeTransport);

		// Setup the receive handler.
		receiveChannel.receive({role: 'test', cmd: 'command:message'}, messageHandler);

		readTransport.on('close', function () {
			t.end();
		});

		// Send the command.
		broadcastChannel.broadcast({role: 'test', cmd: 'command:message'}, paylaod);
	});

	test('read error handler is not called', function (t) {
		t.plan(1);
		t.equal(readErrorHandler.callCount, 0);
	});

	test('write error handler is not called', function (t) {
		t.plan(1);
		t.equal(writeErrorHandler.callCount, 0);
	});

	test('got message paylaod', function (t) {
		t.plan(2);
		const args = messageHandler.args[0][0];
		t.ok(typeof paylaod.id !== 'undefined', 'paylaod is present');
		t.equal(args.id, paylaod.id);
	});

	test('message:deleted is called only once', function (t) {
		t.plan(1);
		t.equal(messageDeletedHandler.callCount, 1);
	});
})();

(function messageHandlersReject() {
	const paylaod = {
		id: 'command_failures'
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

	const receiveChannelErrorHandler = sinon.spy();
	const sendChannelErrorHandler = sinon.spy();

	const readErrorHandler = sinon.spy();
	const writeErrorHandler = sinon.spy();

	const messageDeletedHandler = sinon.spy();

	const successErrorHandler = sinon.spy(function () {
		return Promise.resolve(null);
	});

	const refuseErrorHandler = sinon.spy(function () {
		receiveChannel.remove({role: 'test'}, refuseErrorHandler);
		receiveChannel.receive({role: 'test'}, successErrorHandler);
		return Promise.resolve(false);
	});

	const rejectErrorHandler = sinon.spy(function () {
		receiveChannel.remove({role: 'test'}, rejectErrorHandler);
		receiveChannel.receive({role: 'test'}, refuseErrorHandler);
		return Promise.reject(Error('reject error'));
	});

	const throwErrorHandler = sinon.spy(function () {
		receiveChannel.remove({role: 'test'}, throwErrorHandler);
		receiveChannel.receive({role: 'test'}, rejectErrorHandler);
		throw new Error('thrown error');
	});

	test('before all messageHandlersReject', function (t) {
		// Setup transport error event tests
		readTransport.on('error', readErrorHandler);
		writeTransport.on('error', writeErrorHandler);

		// Setup channel error event tests
		receiveChannel.on('error', receiveChannelErrorHandler);
		sendChannel.on('error', sendChannelErrorHandler);

		// End the tests when the message is finally deleted from the queue.
		readTransport.on('message:deleted', messageDeletedHandler);
		readTransport.on('message:deleted', function () {
			readTransport.close();
		});

		// Bind the transports to the channels.
		receiveChannel.use({role: 'test'}, readTransport);
		sendChannel.use({role: 'test'}, writeTransport);

		// Setup the receive handler chain.
		receiveChannel.receive({role: 'test'}, throwErrorHandler);

		readTransport.on('close', function () {
			t.end();
		});

		// Send the command.
		sendChannel.send({role: 'test', cmd: 'command:message'}, paylaod);
	});

	test('transport error events are not fired', function (t) {
		t.plan(2);
		t.equal(readErrorHandler.callCount, 0);
		t.equal(writeErrorHandler.callCount, 0);
	});

	test('send channel error events are not fired', function (t) {
		t.plan(1);
		t.equal(sendChannelErrorHandler.callCount, 0);
	});

	test('receive channel error events are fired', function (t) {
		t.plan(2);
		const args = receiveChannelErrorHandler.args.map(function (args) {
			return args[0];
		});
		t.equal(args[0].message, 'thrown error');
		t.equal(args[1].message, 'reject error');
	});

	test('message:deleted is called only once', function (t) {
		t.plan(1);
		t.equal(messageDeletedHandler.callCount, 1);
	});
})();
