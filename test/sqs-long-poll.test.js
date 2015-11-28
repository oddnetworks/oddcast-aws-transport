'use strict';

const Promise = require('bluebird');
const BRIXX = require('brixx');
const sinon = require('sinon');
const TEST = require('./');
const LongPollMixin = require('../lib/sqs-long-poll');
const createLongPoll = BRIXX.factory(LongPollMixin);
const queueURL = 'http://some.domain.net/url';
const Body = '{"pattern":1,"payload":1}';

TEST.suite(function runTwiceWithoutError(suite) {
	const sqs = Object.freeze({
		receiveMessage: sinon.spy(function mockReceiveMessage(params, callback) {
			// Call the callback async like the real thing.
			setTimeout(function () {
				callback(null, {
					Body: Body
				});
			}, 12);
		})
	});
	const errorHandler = sinon.spy();
	const subject = createLongPoll({
		sqs: sqs,
		queueURL: queueURL
	});
	const messages = [];

	suite.before(function () {
		return new Promise(function (resolve, reject) {
			const timeout = setTimeout(function () {
				reject(new Error('timeout: runTwiceWithoutError'));
			}, 60);

			subject.on('error', errorHandler);

			subject.on('message:received', function (message) {
				messages.push(message);
				if (messages.length >= 2) {
					clearTimeout(timeout);
					subject.stop();
					resolve();
				}
			});

			subject.start();
		});
	});

	suite.test(function (test) {
		const args = sqs.receiveMessage.args;
		const paramCalls = Object.freeze(args.map(function (args) {
			return args[0];
		}));

		test('receiveMessage called twice', function (t) {
			t.plan(1);
			t.equal(sqs.receiveMessage.callCount, 2);
		});
		test('receiveMessage called with parameters', function (t) {
			t.plan(6);
			paramCalls.forEach(function (params) {
				t.equal(params.QueueURL, queueURL);
				t.equal(params.MaxNumberOfMessages, 1);
				t.equal(params.WaitTimeSeconds, 20);
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
	});
});

TEST.suite(function runTwiceWithError(suite) {
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
	const subject = createLongPoll({
		sqs: sqs,
		queueURL: queueURL
	});
	const errors = [];

	suite.before(function () {
		return new Promise(function (resolve) {
			setTimeout(function () {
				resolve();
			}, 36);

			subject.on('message:received', messageReceivedHandler);

			subject.on('error', function (error) {
				errors.push(error);
			});

			subject.start();
		});
	});

	suite.test(function (test) {
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
	});
});
