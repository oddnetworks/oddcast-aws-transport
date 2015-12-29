'use strict';
const Promise = require('bluebird');
const test = require('tape');
const sinon = require('sinon');
const SQSCommandEmitter = require('../lib/sqs-command-emitter');

const payload = {first: 1};
const pattern = {role: 'test'};
const queueUrl = 'http://foobarbaz';
const response = {val: 'AWS-Response'};

(function sendWithNoError() {
	const subject = SQSCommandEmitter.create({
		queueUrl: queueUrl,
		region: 'foo',
		accessKeyId: 'bar',
		secretAccessKey: 'baz'
	});

	const messageSentHandler = sinon.spy();
	const errorHandler = sinon.spy();

	test('before all sendWithNoError', function (t) {
		sinon.stub(subject.sqs, 'sendMessage', function (opts, callback) {
			callback(null, response);
		});

		subject.on('error', errorHandler);
		subject.on('message:sent', messageSentHandler);

		subject.write({
			pattern: pattern,
			payload: payload
		});

		Promise.delay(1).then(t.end);
	});

	test('sqs.sendMessage() is called', function (t) {
		t.plan(4);
		const options = subject.sqs.sendMessage.args[0][0];
		t.equal(options.QueueUrl, queueUrl);
		t.equal(options.MessageBody, JSON.stringify(payload));
		const attrs = options.MessageAttributes;
		t.equal(attrs.pattern.DataType, 'String');
		t.equal(attrs.pattern.StringValue, JSON.stringify(pattern));
	});

	test('message:sent is emitted', function (t) {
		t.plan(1);
		t.equal(messageSentHandler.args[0][0], response);
	});

	test('error event is not emitted', function (t) {
		t.plan(1);
		t.equal(errorHandler.callCount, 0);
	});
})();
