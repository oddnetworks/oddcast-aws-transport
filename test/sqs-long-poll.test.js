'use strict';

const Promise = require('bluebird');
const BRIXX = require('brixx');
const sinon = require('sinon');
const TEST = require('./');
const LongPollMixin = require('../lib/sqs-long-poll');

TEST.suite(function runTwiceWithoutError(suite) {
	const createLongPoll = BRIXX.factory(LongPollMixin);
	const queueURL = 'http://some.domain.net/url';
	const sqs = Object.freeze({
		receiveMessage: sinon.spy(function mockReceiveMessage(params, callback) {
			// Call the callback async like the real thing.
			setTimeout(callback, 12);
		})
	});
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
		test('receiveMessage called twice', function (t) {
			t.plan(1);
			t.equal(sqs.receiveMessage.callCount, 2);
		});
	});
});
