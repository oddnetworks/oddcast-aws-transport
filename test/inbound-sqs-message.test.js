'use strict';

const test = require('tape');
const SQSMessage = require('../lib/inbound-sqs-message');

(function withSNSNotification() {
	const snsMessage = Object.freeze({
		Type: 'Notification',
		MessageId: '8a0ba019-e563-5ab0-835e-eed2c72c12a6',
		TopicArn: 'arn:aws:sns:us-west-2:654728787792:r-and-d-events-transport',
		Message: '{"foo":"bar"}',
		Timestamp: '2015-11-22T01:53:19.704Z',
		SignatureVersion: '1',
		Signature: 'WFGlVTuBf9vZ==',
		SigningCertURL: 'https://sns.us-west-2.amazonaws.com/' +
										'SimpleNotificationService-bb750dd426d95ee9390147a5624348ee.pem',
		UnsubscribeURL: 'https://sns.us-west-2.amazonaws.com/' +
										'?Action=Unsubscribe',
		MessageAttributes: Object.freeze({
			pattern: {
				Type: 'String',
				Value: '{"role":"logging"}'
			}
		})
	});
	const MessageId = '67f78cd8-e937-49f8-b768-8317dca7f5bc';
	const ReceiptHandle = 'AQEB1p0i/F99u6VbFtt7E';
	const Body = JSON.stringify(snsMessage);
	const MD5OfBody = '7f57108070101e8c6cfb008c8e0a206a';
	const Attributes = Object.freeze({
		SenderId: 'ZIDAIXLAVTELUXBIEIX46',
		ApproximateFirstReceiveTimestamp: '1448159995491',
		ApproximateReceiveCount: '3',
		SentTimestamp: '1448157199780'
	});

	const subject = SQSMessage.create({
		MessageId: MessageId,
		ReceiptHandle: ReceiptHandle,
		MD5OfBody: MD5OfBody,
		Body: Body,
		Attributes: Attributes
	});

	test('has MessageId', function (t) {
		t.plan(1);
		t.equal(subject.MessageId, MessageId);
	});
	test('has ReceiptHandle', function (t) {
		t.plan(1);
		t.equal(subject.ReceiptHandle, ReceiptHandle);
	});
	test('has MD5OfBody', function (t) {
		t.plan(1);
		t.equal(subject.MD5OfBody, MD5OfBody);
	});
	test('has Body', function (t) {
		t.plan(1);
		t.equal(subject.Body, Body);
	});
	test('has Attributes', function (t) {
		t.plan(2);
		t.equal(subject.Attributes.SenderId, Attributes.SenderId);
		t.equal(subject.Attributes.SentTimestamp, Attributes.SentTimestamp);
	});
	test('has pattern', function (t) {
		t.plan(1);
		t.equal(subject.pattern.role, 'logging');
	});
	test('has payload', function (t) {
		t.plan(1);
		t.equal(subject.payload.foo, 'bar');
	});
	test('has toJSON()', function (t) {
		t.plan(9);
		var data = subject.toJSON();
		t.equal(data.MessageId, MessageId);
		t.equal(data.ReceiptHandle, ReceiptHandle);
		t.equal(data.MD5OfBody, MD5OfBody);
		t.equal(data.Body, Body);
		t.equal(data.Attributes.SenderId, Attributes.SenderId);
		t.equal(data.Attributes.SentTimestamp, Attributes.SentTimestamp);
		t.equal(data.pattern.role, 'logging');
		t.equal(data.payload.foo, 'bar');
		t.equal(typeof data.receive, 'undefined');
	});
})();
