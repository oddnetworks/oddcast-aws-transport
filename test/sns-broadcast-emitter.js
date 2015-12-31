'use strict';
const test = require('tape');
const sinon = require('sinon');
const SNSBroadcastEmitter = require('../lib/sns-broadcast-emitter');

(function broadcastWithNoError() {
	const topicArn = 'http://example.com/your/sns';
	const subject = SNSBroadcastEmitter.create({
		topicArn: topicArn,
		region: 'foo',
		accessKeyId: 'bar',
		secretAccessKey: 'foobar'
	});
	const pattern = {role: 'commander'};
	const payload = {attack: 'at dawn'};
	const snsResponse = {sns: 'response'};

	const messagePublishedHandler = sinon.spy();
	const errorHandler = sinon.spy();

	sinon.stub(subject.sns, 'publish', function (params, callback) {
		// Execute in the next turn of the event loop just like a real
		// callback would.
		setTimeout(function () {
			callback(null, snsResponse);
		}, 12);
	});

	test('before all broadcastWithNoError', function (t) {
		subject.on('error', errorHandler);
		subject.on('message:published', messagePublishedHandler);

		subject.on('error', function () {
			t.end();
		});
		subject.on('message:published', function () {
			t.end();
		});

		subject.write({
			pattern: pattern,
			payload: payload
		});
	});

	test('sns.publish() is called', function (t) {
		t.plan(4);
		const params = subject.sns.publish.args[0][0];
		t.equal(params.TopicArn, topicArn);
		t.equal(params.Message, JSON.stringify(payload));
		t.equal(params.MessageAttributes.pattern.DataType, 'String');
		t.equal(params.MessageAttributes.pattern.StringValue, JSON.stringify(pattern));
	});

	test('"message:published" event is fired', function (t) {
		t.plan(1);
		const res = messagePublishedHandler.args[0][0];
		t.equal(res, snsResponse);
	});

	test('"error" event is not fired', function (t) {
		t.plan(1);
		t.equal(errorHandler.callCount, 0);
	});
})();
