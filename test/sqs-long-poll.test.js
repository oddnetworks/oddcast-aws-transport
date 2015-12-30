'use strict';

const test = require('tape');
const sinon = require('sinon');
const SQSLongPoll = require('../lib/sqs-long-poll');
const queueUrl = 'http://some.domain.net/url';
const Body = '{"arg":1}';
const MessageAttributes = Object.freeze({
	pattern: {
		Type: 'String',
		StringValue: '{"role":"db"}'
	}
});

(function runTwiceWithoutError() {
	const sqs = Object.freeze({
		receiveMessage: sinon.spy(function mockReceiveMessage(params, callback) {
			// Call the callback async like the real thing.
			setTimeout(function () {
				callback(null, {
					Messages: [{
						Body: Body,
						MessageAttributes: MessageAttributes
					}]
				});
			}, 12);
		})
	});
	const errorHandler = sinon.spy();
	const subject = SQSLongPoll.create({
		sqs: sqs,
		queueUrl: queueUrl
	});
	const messages = [];

	test('before runTwiceWithoutError', function (t) {
		const timeout = setTimeout(function () {
			throw new Error('timeout: runTwiceWithoutError');
		}, 60);

		subject.on('error', errorHandler);

		subject.on('message:received', function (message) {
			messages.push(message);
			if (messages.length >= 2) {
				clearTimeout(timeout);
				subject.stop();
				t.end();
			}
		});

		subject.start();
	});
	test('receiveMessage called', function (t) {
		t.plan(1);
		t.ok(sqs.receiveMessage.callCount >= 2, 'callCount >= 2');
	});
	test('receiveMessage called with parameters', function (t) {
		t.plan(8);
		const args = sqs.receiveMessage.args;
		const paramCalls = Object.freeze(args.map(function (args) {
			return args[0];
		}).slice(0, 2));
		paramCalls.forEach(function (params) {
			t.equal(params.QueueUrl, queueUrl, 'params.QueueUrl');
			t.equal(params.MaxNumberOfMessages, 1, 'params.MaxNumberOfMessages');
			t.equal(params.WaitTimeSeconds, 20, 'params.WaitTimeSeconds');
			t.equal(params.MessageAttributeNames[0], 'pattern',
				'params.MessageAttributeNames');
		});
	});
	test('receives messages', function (t) {
		const keys = [
			'MessageId',
			'ReceiptHandle',
			'MD5OfBody',
			'Body',
			'Attributes',
			'pattern',
			'payload'
		];
		t.plan(14);
		messages.forEach(function (message) {
			Object.keys(message.toJSON()).forEach(function (key) {
				t.ok(keys.indexOf(key) >= 0, 'key: ' + key);
			});
		});
	});
	test('error is not emitted', function (t) {
		t.plan(1);
		t.equal(errorHandler.callCount, 0);
	});
})();

(function runTwiceWithError() {
	const error = new Error('runTwiceWithError');
	const sqs = Object.freeze({
		receiveMessage: sinon.spy(function mockReceiveMessage(params, callback) {
			// Call the callback async like the real thing.
			setTimeout(function () {
				callback(error);
			}, 12);
		})
	});
	const messageReceivedHandler = sinon.spy();
	const subject = SQSLongPoll.create({
		sqs: sqs,
		queueUrl: queueUrl
	});
	const errors = [];

	test('before runTwiceWithError', function (t) {
		setTimeout(function () {
			t.end();
		}, 36);

		subject.on('message:received', messageReceivedHandler);

		subject.on('error', function (error) {
			errors.push(error);
		});

		subject.start();
	});
	test('receiveHandler is never called', function (t) {
		t.plan(1);
		t.equal(messageReceivedHandler.callCount, 0);
	});
	test('error handler called once', function (t) {
		t.plan(1);
		t.equal(errors.length, 1);
	});
	test('error handler called with an error', function (t) {
		t.plan(1);
		t.equal(errors[0], error, 'throw the error');
	});
})();
