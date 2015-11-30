'use strict';

const Promise = require('bluebird');
const test = require('tape');
const sinon = require('sinon');
const sqsCommandListener = require('../lib/sqs-command-listener');
// const SQSLongPoll = require('../lib/sqs-long-poll');

const messageJSON = {};
const messagePattern = {};
const messagePayload = {};
const message = Object.freeze({
	pattern: messagePattern,
	payload: messagePayload,
	toJSON: function () {
		return messageJSON;
	}
});

const createTransport = sqsCommandListener({
	queueURL: 'foo',
	region: 'foo',
	accessKeyId: 'foo',
	secretAccessKey: 'foo'
});

(function messageReceivedAndHandled() {
	const handler = sinon.spy(function () {
		return Promise.resolve();
	});
	const matcher = {
		findSingle: sinon.spy(function () {
			return handler;
		})
	};
	const subject = createTransport(matcher);
	const messageReceivedHandler = sinon.spy();
	const messageHandledHandler = sinon.spy();
	const messageErrorHandler = sinon.spy();
	const messageIgnoredHandler = sinon.spy();

	const deleteMessage = sinon.stub(subject.longPoll, 'deleteMessage');

	test('before messageReceivedAndHandled', function (t) {
		subject.on('message:received', messageReceivedHandler);
		subject.on('message:handled', messageHandledHandler);
		subject.on('message:error', messageErrorHandler);
		subject.on('message:ignored', messageIgnoredHandler);

		subject.longPoll.emit('message:received', message);
		Promise.delay(12).then(t.end);
	});
	test('message:received is emitted', function (t) {
		const arg = messageReceivedHandler.args[0][0];
		t.equal(arg, messageJSON);
		t.end();
	});
	test('matcher.findSingle is called', function (t) {
		const arg = matcher.findSingle.args[0][0];
		t.equal(arg, messagePattern);
		t.end();
	});
	test('handler is called', function (t) {
		const arg = handler.args[0][0];
		t.equal(arg.messagePayload);
		t.end();
	});
	test('message:ignored is not emitted', function (t) {
		t.equal(messageIgnoredHandler.callCount, 0);
		t.end();
	});
	test('deleteMessage is called', function (t) {
		const arg = deleteMessage.args[0][0];
		t.equal(arg, message);
		t.end();
	});
	test('message:handled is emitted', function (t) {
		const arg = messageHandledHandler.args[0][0];
		t.equal(arg, messageJSON);
		t.end();
	});
	test('message:error is not emitted', function (t) {
		t.equal(messageErrorHandler.callCount, 0);
		t.end();
	});
})();

(function messageReceivedAndNotHandled() {
	const handler = sinon.spy(function () {
		return Promise.resolve(false);
	});
	const matcher = {
		findSingle: sinon.spy(function () {
			return handler;
		})
	};
	const subject = createTransport(matcher);
	const messageReceivedHandler = sinon.spy();
	const messageHandledHandler = sinon.spy();
	const messageErrorHandler = sinon.spy();
	const messageIgnoredHandler = sinon.spy();

	const deleteMessage = sinon.stub(subject.longPoll, 'deleteMessage');

	test('before messageReceivedAndHandled', function (t) {
		subject.on('message:received', messageReceivedHandler);
		subject.on('message:handled', messageHandledHandler);
		subject.on('message:error', messageErrorHandler);
		subject.on('message:ignored', messageIgnoredHandler);

		subject.longPoll.emit('message:received', message);
		Promise.delay(12).then(t.end);
	});
	test('message:received is emitted', function (t) {
		const arg = messageReceivedHandler.args[0][0];
		t.equal(arg, messageJSON);
		t.end();
	});
	test('matcher.findSingle is called', function (t) {
		const arg = matcher.findSingle.args[0][0];
		t.equal(arg, messagePattern);
		t.end();
	});
	test('handler is called', function (t) {
		const arg = handler.args[0][0];
		t.equal(arg.messagePayload);
		t.end();
	});
	test('message:ignored is emitted', function (t) {
		const arg = messageIgnoredHandler.args[0][0];
		t.equal(arg, messageJSON);
		t.end();
	});
	test('deleteMessage is not called', function (t) {
		t.equal(deleteMessage.callCount, 0);
		t.end();
	});
	test('message:handled is not emitted', function (t) {
		t.equal(messageHandledHandler.callCount, 0);
		t.end();
	});
	test('message:error is not emitted', function (t) {
		t.equal(messageErrorHandler.callCount, 0);
		t.end();
	});
})();

(function messageReceivedAndThrow() {
	const error = new Error('TEST messageReceivedAndThrow');
	const handler = sinon.spy(function () {
		throw error;
	});
	const matcher = {
		findSingle: sinon.spy(function () {
			return handler;
		})
	};
	const subject = createTransport(matcher);
	const messageReceivedHandler = sinon.spy();
	const messageHandledHandler = sinon.spy();
	const messageErrorHandler = sinon.spy();
	const errorHandler = sinon.spy();
	const messageIgnoredHandler = sinon.spy();

	const deleteMessage = sinon.stub(subject.longPoll, 'deleteMessage');

	test('before messageReceivedAndHandled', function (t) {
		subject.on('message:received', messageReceivedHandler);
		subject.on('message:handled', messageHandledHandler);
		subject.on('message:error', messageErrorHandler);
		subject.on('error', errorHandler);
		subject.on('message:ignored', messageIgnoredHandler);

		subject.longPoll.emit('message:received', message);
		Promise.delay(12).then(t.end);
	});
	test('message:received is emitted', function (t) {
		const arg = messageReceivedHandler.args[0][0];
		t.equal(arg, messageJSON);
		t.end();
	});
	test('matcher.findSingle is called', function (t) {
		const arg = matcher.findSingle.args[0][0];
		t.equal(arg, messagePattern);
		t.end();
	});
	test('handler is called', function (t) {
		const arg = handler.args[0][0];
		t.equal(arg.messagePayload);
		t.end();
	});
	test('message:ignored is not emitted', function (t) {
		t.equal(messageIgnoredHandler.callCount, 0);
		t.end();
	});
	test('deleteMessage is not called', function (t) {
		t.equal(deleteMessage.callCount, 0);
		t.end();
	});
	test('message:handled is not emitted', function (t) {
		t.equal(messageHandledHandler.callCount, 0);
		t.end();
	});
	test('message:error is emitted', function (t) {
		const arg = messageErrorHandler.args[0][0];
		t.equal(arg, messageJSON);
		t.end();
	});
	test('message:error is emitted', function (t) {
		const arg = errorHandler.args[0][0];
		t.equal(arg, error);
		t.end();
	});
})();

(function messageReceivedAndReject() {
	const error = new Error('TEST messageReceivedAndThrow');
	const handler = sinon.spy(function () {
		return Promise.reject(error);
	});
	const matcher = {
		findSingle: sinon.spy(function () {
			return handler;
		})
	};
	const subject = createTransport(matcher);
	const messageReceivedHandler = sinon.spy();
	const messageHandledHandler = sinon.spy();
	const messageErrorHandler = sinon.spy();
	const errorHandler = sinon.spy();
	const messageIgnoredHandler = sinon.spy();

	const deleteMessage = sinon.stub(subject.longPoll, 'deleteMessage');

	test('before messageReceivedAndHandled', function (t) {
		subject.on('message:received', messageReceivedHandler);
		subject.on('message:handled', messageHandledHandler);
		subject.on('message:error', messageErrorHandler);
		subject.on('error', errorHandler);
		subject.on('message:ignored', messageIgnoredHandler);

		subject.longPoll.emit('message:received', message);
		Promise.delay(12).then(t.end);
	});
	test('message:received is emitted', function (t) {
		const arg = messageReceivedHandler.args[0][0];
		t.equal(arg, messageJSON);
		t.end();
	});
	test('matcher.findSingle is called', function (t) {
		const arg = matcher.findSingle.args[0][0];
		t.equal(arg, messagePattern);
		t.end();
	});
	test('handler is called', function (t) {
		const arg = handler.args[0][0];
		t.equal(arg.messagePayload);
		t.end();
	});
	test('message:ignored is not emitted', function (t) {
		t.equal(messageIgnoredHandler.callCount, 0);
		t.end();
	});
	test('deleteMessage is not called', function (t) {
		t.equal(deleteMessage.callCount, 0);
		t.end();
	});
	test('message:handled is not emitted', function (t) {
		t.equal(messageHandledHandler.callCount, 0);
		t.end();
	});
	test('message:error is emitted', function (t) {
		const arg = messageErrorHandler.args[0][0];
		t.equal(arg, messageJSON);
		t.end();
	});
	test('message:error is emitted', function (t) {
		const arg = errorHandler.args[0][0];
		t.equal(arg, error);
		t.end();
	});
})();

(function messageReceivedWithNoHandler() {
	const matcher = {
		findSingle: sinon.spy(function () {
			return null;
		})
	};
	const subject = createTransport(matcher);
	const messageReceivedHandler = sinon.spy();
	const messageHandledHandler = sinon.spy();
	const messageErrorHandler = sinon.spy();
	const messageIgnoredHandler = sinon.spy();

	const deleteMessage = sinon.stub(subject.longPoll, 'deleteMessage');

	test('before messageReceivedWithNoHandler', function (t) {
		subject.on('message:received', messageReceivedHandler);
		subject.on('message:handled', messageHandledHandler);
		subject.on('message:error', messageErrorHandler);
		subject.on('message:ignored', messageIgnoredHandler);

		subject.longPoll.emit('message:received', message);
		Promise.delay(12).then(t.end);
	});
	test('message:received is emitted', function (t) {
		const arg = messageReceivedHandler.args[0][0];
		t.equal(arg, messageJSON);
		t.end();
	});
	test('matcher.findSingle is called', function (t) {
		const arg = matcher.findSingle.args[0][0];
		t.equal(arg, messagePattern);
		t.end();
	});
	test('message:ignored is emitted', function (t) {
		const arg = messageIgnoredHandler.args[0][0];
		t.equal(arg, messageJSON);
		t.end();
	});
	test('deleteMessage is not called', function (t) {
		t.equal(deleteMessage.callCount, 0);
		t.end();
	});
	test('message:handled is not emitted', function (t) {
		t.equal(messageHandledHandler.callCount, 0);
		t.end();
	});
	test('message:error is not emitted', function (t) {
		t.equal(messageErrorHandler.callCount, 0);
		t.end();
	});
})();
