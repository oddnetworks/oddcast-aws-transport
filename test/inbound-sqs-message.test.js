'use strict';

const TEST = require('./');
const BRIXX = require('brixx');
const MessageMixin = require('../lib/inbound-sqs-message');

TEST.suite(function withSNSNotification(suite) {
	let subject;
	let createMessage = BRIXX.factory(MessageMixin);
	let snsMessage = Object.freeze({
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
			Type: 'String',
			Value: '{"role":"logging"}'
		})
	});
	let MessageId = '67f78cd8-e937-49f8-b768-8317dca7f5bc';
	let ReceiptHandle = 'AQEB1p0i/F99u6VbFtt7E';
	let Body = JSON.stringify(snsMessage);
	let MD5OfBody = '7f57108070101e8c6cfb008c8e0a206a';
	let Attributes = Object.freeze({
		SenderId: 'ZIDAIXLAVTELUXBIEIX46',
		ApproximateFirstReceiveTimestamp: '1448159995491',
		ApproximateReceiveCount: '3',
		SentTimestamp: '1448157199780'
	});

	suite.before(function () {
		subject = createMessage({
			MessageId: MessageId,
			ReceiptHandle: ReceiptHandle,
			MD5OfBody: MD5OfBody,
			Body: Body,
			Attributes: Attributes
		});
	});

	suite.test(function (test) {
		test('has MessageId', function (t) {
			t.plan(1);
			t.equal(subject.MessageId, MessageId);
		});
	});
});
