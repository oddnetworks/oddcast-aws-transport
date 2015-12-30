'use strict';
const Promise = require('bluebird');
const test = require('tape');
const sinon = require('sinon');
const SQSCommandListener = require('../lib/sqs-command-listener');

const messageJSON = {};
const messagePattern = {pattern: 1};
const messagePayload = {payload: 1};
const message = Object.freeze({
	ReceiptHandle: 'foobarbaz',
	pattern: messagePattern,
	payload: messagePayload,
	toJSON: function () {
		return messageJSON;
	}
});

(function messageReceivedAndHandled() {
	const subject = SQSCommandListener.create({
		queueUrl: 'foo',
		region: 'foo',
		accessKeyId: 'foo',
		secretAccessKey: 'foo'
	});
	const handler = sinon.spy(function () {
		return Promise.resolve();
	});
	subject.setHandler(handler);
	const messageReceivedHandler = sinon.spy();
	const messageHandledHandler = sinon.spy();
	const messageDeletedHandler = sinon.spy();
	const messageErrorHandler = sinon.spy();
	const messageIgnoredHandler = sinon.spy();
	const errorHandler = sinon.spy();

	function sqsDeleteMessage(params, callback) {
		callback(null);
	}

	sinon.stub(subject.longPoll, 'start');
	sinon.stub(subject.sqs, 'deleteMessage', sqsDeleteMessage);

	test('before messageReceivedAndHandled', function (t) {
		subject.on('message:received', messageReceivedHandler);
		subject.on('message:handled', messageHandledHandler);
		subject.on('message:deleted', messageDeletedHandler);
		subject.on('message:error', messageErrorHandler);
		subject.on('message:ignored', messageIgnoredHandler);
		subject.on('error', errorHandler);
		subject.resume();

		subject.longPoll.emit('message:received', message);
		Promise.delay(1).then(t.end);
	});
	test('longPoll.start() is called', function (t) {
		t.plan(1);
		t.equal(subject.longPoll.start.callCount, 1);
	});
	test('message:received is emitted', function (t) {
		t.plan(1);
		const arg = messageReceivedHandler.args[0][0];
		t.equal(arg, messageJSON);
	});
	test('handler is called', function (t) {
		t.plan(2);
		const arg = handler.args[0][0];
		t.equal(arg.pattern, message.pattern);
		t.equal(arg.payload, message.payload);
	});
	test('message:ignored is not emitted', function (t) {
		t.plan(1);
		t.equal(messageIgnoredHandler.callCount, 0);
	});
	test('deleteMessage is called', function (t) {
		t.plan(2);
		const params = subject.sqs.deleteMessage.firstCall.args[0];
		t.equal(params.QueueUrl, subject.queueUrl);
		t.equal(params.ReceiptHandle, message.ReceiptHandle);
	});
	test('message:handled is emitted', function (t) {
		t.plan(1);
		const arg = messageHandledHandler.args[0][0];
		t.equal(arg, messageJSON);
	});
	test('message:deleted is emitted', function (t) {
		t.plan(1);
		const arg = messageDeletedHandler.args[0][0];
		t.equal(arg, messageJSON);
	});
	test('message:error is not emitted', function (t) {
		t.equal(messageErrorHandler.callCount, 0);
		t.end();
	});
	test('error is not emitted', function (t) {
		t.plan(1);
		t.equal(errorHandler.callCount, 0);
	});
})();

(function messageReceivedAndNotHandled() {
	const subject = SQSCommandListener.create({
		queueUrl: 'foo',
		region: 'foo',
		accessKeyId: 'foo',
		secretAccessKey: 'foo'
	});
	const handler = sinon.spy(function () {
		return Promise.resolve(false);
	});
	subject.setHandler(handler);
	const messageReceivedHandler = sinon.spy();
	const messageHandledHandler = sinon.spy();
	const messageDeletedHandler = sinon.spy();
	const messageErrorHandler = sinon.spy();
	const messageIgnoredHandler = sinon.spy();
	const errorHandler = sinon.spy();

	function sqsDeleteMessage(params, callback) {
		callback(null);
	}

	sinon.stub(subject.longPoll, 'start');
	sinon.stub(subject.sqs, 'deleteMessage', sqsDeleteMessage);

	test('before messageReceivedAndHandled', function (t) {
		subject.on('message:received', messageReceivedHandler);
		subject.on('message:handled', messageHandledHandler);
		subject.on('message:deleted', messageDeletedHandler);
		subject.on('message:error', messageErrorHandler);
		subject.on('message:ignored', messageIgnoredHandler);
		subject.on('error', errorHandler);
		subject.resume();

		subject.longPoll.emit('message:received', message);
		Promise.delay(12).then(t.end);
	});
	test('longPoll.start() is called', function (t) {
		t.plan(1);
		t.equal(subject.longPoll.start.callCount, 1);
	});
	test('message:received is emitted', function (t) {
		t.plan(1);
		const arg = messageReceivedHandler.args[0][0];
		t.equal(arg, messageJSON);
	});
	test('handler is called', function (t) {
		t.plan(2);
		const arg = handler.args[0][0];
		t.equal(arg.pattern, message.pattern);
		t.equal(arg.payload, message.payload);
	});
	test('message:ignored is emitted', function (t) {
		t.plan(1);
		const arg = messageIgnoredHandler.args[0][0];
		t.equal(arg, messageJSON);
	});
	test('deleteMessage is not called', function (t) {
		t.plan(1);
		t.equal(subject.sqs.deleteMessage.callCount, 0);
	});
	test('message:handled is not emitted', function (t) {
		t.plan(1);
		t.equal(messageHandledHandler.callCount, 0);
	});
	test('message:deleted is not emitted', function (t) {
		t.plan(1);
		t.equal(messageDeletedHandler.callCount, 0);
	});
	test('message:error is not emitted', function (t) {
		t.plan(1);
		t.equal(messageErrorHandler.callCount, 0);
	});
	test('error is not emitted', function (t) {
		t.plan(1);
		t.equal(errorHandler.callCount, 0);
	});
})();

(function messageReceivedAndRejected() {
	const error = new Error('TEST messageReceivedAndRejected');
	const handler = sinon.spy(function () {
		return Promise.reject(error);
	});
	const subject = SQSCommandListener.create({
		queueUrl: 'foo',
		region: 'foo',
		accessKeyId: 'foo',
		secretAccessKey: 'foo'
	});
	subject.setHandler(handler);
	const messageReceivedHandler = sinon.spy();
	const messageHandledHandler = sinon.spy();
	const messageDeletedHandler = sinon.spy();
	const messageErrorHandler = sinon.spy();
	const messageIgnoredHandler = sinon.spy();
	const errorHandler = sinon.spy();

	function sqsDeleteMessage(params, callback) {
		callback(null);
	}

	sinon.stub(subject.longPoll, 'start');
	sinon.stub(subject.sqs, 'deleteMessage', sqsDeleteMessage);

	test('before messageReceivedAndHandled', function (t) {
		subject.on('message:received', messageReceivedHandler);
		subject.on('message:handled', messageHandledHandler);
		subject.on('message:deleted', messageDeletedHandler);
		subject.on('message:error', messageErrorHandler);
		subject.on('error', errorHandler);
		subject.on('message:ignored', messageIgnoredHandler);
		subject.resume();

		subject.longPoll.emit('message:received', message);
		Promise.delay(12).then(t.end);
	});
	test('longPoll.start() is called', function (t) {
		t.plan(1);
		t.equal(subject.longPoll.start.callCount, 1);
	});
	test('message:received is emitted', function (t) {
		t.plan(1);
		const arg = messageReceivedHandler.args[0][0];
		t.equal(arg, messageJSON);
	});
	test('handler is called', function (t) {
		t.plan(2);
		const arg = handler.args[0][0];
		t.equal(arg.pattern, message.pattern);
		t.equal(arg.payload, message.payload);
	});
	test('message:ignored is not emitted', function (t) {
		t.plan(1);
		t.equal(messageIgnoredHandler.callCount, 0);
	});
	test('deleteMessage is not called', function (t) {
		t.plan(1);
		t.equal(subject.sqs.deleteMessage.callCount, 0);
	});
	test('message:handled is not emitted', function (t) {
		t.plan(1);
		t.equal(messageHandledHandler.callCount, 0);
	});
	test('message:error is emitted', function (t) {
		t.plan(1);
		const arg = messageErrorHandler.args[0][0];
		t.equal(arg, error);
	});
	test('error is not emitted', function (t) {
		t.plan(1);
		t.equal(errorHandler.callCount, 0);
	});
})();

(function withSQSLongPollError() {
	const error = new Error('TEST withSQSLongPollError');
	const handler = sinon.spy(function () {
		return Promise.resolve(true);
	});
	const subject = SQSCommandListener.create({
		queueUrl: 'foo',
		region: 'foo',
		accessKeyId: 'foo',
		secretAccessKey: 'foo'
	});
	subject.setHandler(handler);
	const messageReceivedHandler = sinon.spy();
	const messageHandledHandler = sinon.spy();
	const messageDeletedHandler = sinon.spy();
	const messageErrorHandler = sinon.spy();
	const messageIgnoredHandler = sinon.spy();
	const errorHandler = sinon.spy();

	function sqsDeleteMessage(params, callback) {
		callback(null);
	}

	sinon.stub(subject.longPoll, 'start');
	sinon.stub(subject.sqs, 'deleteMessage', sqsDeleteMessage);

	test('before messageReceivedAndHandled', function (t) {
		subject.on('message:received', messageReceivedHandler);
		subject.on('message:handled', messageHandledHandler);
		subject.on('message:deleted', messageDeletedHandler);
		subject.on('message:error', messageErrorHandler);
		subject.on('error', errorHandler);
		subject.on('message:ignored', messageIgnoredHandler);
		subject.resume();

		subject.longPoll.emit('error', error);
		subject.longPoll.emit('message:received', message);
		Promise.delay(12).then(t.end);
	});
	test('longPoll.start() is called', function (t) {
		t.plan(1);
		t.equal(subject.longPoll.start.callCount, 1);
	});
	test('message:received is emitted', function (t) {
		t.plan(1);
		const arg = messageReceivedHandler.args[0][0];
		t.equal(arg, messageJSON);
	});
	test('handler is called', function (t) {
		t.plan(2);
		const arg = handler.args[0][0];
		t.equal(arg.pattern, message.pattern);
		t.equal(arg.payload, message.payload);
	});
	test('message:ignored is not emitted', function (t) {
		t.plan(1);
		t.equal(messageIgnoredHandler.callCount, 0);
	});
	test('deleteMessage is called', function (t) {
		t.plan(2);
		const params = subject.sqs.deleteMessage.firstCall.args[0];
		t.equal(params.QueueUrl, subject.queueUrl);
		t.equal(params.ReceiptHandle, message.ReceiptHandle);
	});
	test('message:handled is emitted', function (t) {
		t.plan(1);
		const arg = messageHandledHandler.args[0][0];
		t.equal(arg, messageJSON);
	});
	test('message:deleted is emitted', function (t) {
		t.plan(1);
		const arg = messageDeletedHandler.args[0][0];
		t.equal(arg, messageJSON);
	});
	test('message:error is not emitted', function (t) {
		t.equal(messageErrorHandler.callCount, 0);
		t.end();
	});
	test('error is emitted', function (t) {
		t.plan(1);
		const arg = errorHandler.args[0][0];
		t.equal(arg, error);
	});
})();
