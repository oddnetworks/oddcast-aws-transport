'use strict';

const Promise = require('bluebird');
const AWS = require('aws-sdk');
const lib = require('../');

const FAKE_VISIBILITY_TIMEOUT = 30;

class AwsSqsClient {
	constructor(options) {
		this.QueueUrl = options.QueueUrl;
		this.WaitTimeSeconds = options.WaitTimeSeconds;
		this.MaxNumberOfMessages = options.MaxNumberOfMessages;
		this.fakeMessageQueue = [];

		if (options.QueueUrl && options.accessKeyId && options.secretAccessKey && options.region) {
			this.sns = new AWS.SNS({
				accessKeyId: options.accessKeyId,
				secretAccessKey: options.secretAccessKey,
				apiVersion: '2010-03-31',
				region: options.region
			});
		}
	}

	sendMessage(pattern, payload) {
		if (this.sqs) {
			const params = {
				QueueUrl: this.QueueUrl,
				MessageBody: JSON.stringify(payload),
				MessageAttributes: {
					pattern: {
						DataType: 'String',
						StringValue: JSON.stringify(pattern)
					}
				}
			};

			return new Promise((resolve, reject) => {
				this.sqs.sendMessage(params, (err, response) => {
					if (err) {
						return reject(err);
					}

					resolve(response);
				});
			});
		}

		// No SQS object configured. Use the fake message queue.
		const handle = lib.genFakeGuid();
		payload = JSON.stringify(payload);
		pattern = JSON.stringify(pattern);

		const fakeMessage = {
			lastTouched: 0,
			message: {
				MessageId: lib.genFakeGuid(),
				ReceiptHandle: handle,
				MD5OfBody: lib.md5(payload),
				Body: payload,
				MD5OfMessageAttributes: lib.md5(pattern),
				MessageAttributes: {
					pattern: {
						StringValue: pattern,
						StringListValues: [],
						BinaryListValues: [],
						DataType: 'String'
					}
				}
			}
		};

		this.fakeMessageQueue.push(fakeMessage);

		return Promise.resolve(null);
	}

	receiveMessage() {
		if (this.sqs) {
			const options = {
				QueueUrl: this.QueueUrl,
				WaitTimeSeconds: this.WaitTimeSeconds,
				MaxNumberOfMessages: this.MaxNumberOfMessages,
				MessageAttributeNames: ['pattern']
			};

			return new Promise((resolve, reject) => {
				this.sqs.receiveMessage(options, (err, res) => {
					if (err) {
						return reject(err);
					}

					resolve(res.Messages);
				});
			});
		}

		// No SQS object configured. Use the fake message queue.
		const now = Date.now();
		const availableMessages = this.fakeMessageQueue.filter(message => {
			return (now - message.lastTouched) > (FAKE_VISIBILITY_TIMEOUT * 1000);
		});

		return Promise.delay(10).then(() => {
			availableMessages.forEach(message => {
				message.lastTouched = now;
			});

			return availableMessages.map(message => {
				// Make a copy so that it cannot be mutated.
				return JSON.parse(JSON.stringify(message.message));
			});
		});
	}

	deleteMessage(receiptHandle) {
		if (this.sqs) {
			const sqs = this.sqs;
			const params = {
				QueueUrl: this.QueueUrl,
				ReceiptHandle: receiptHandle
			};

			return new Promise((resolve, reject) => {
				sqs.deleteMessage(params, (err, response) => {
					if (err) {
						return reject(err);
					}
					resolve(response);
				});
			});
		}

		// No SQS object configured. Use the fake message queue.
		const messages = this.fakeMessageQueue;
		let index = -1;
		for (let i = 0; i < messages.length; i += 1) {
			if (messages[i].handle === receiptHandle) {
				index = i;
			}
		}
		if (index >= 0) {
			messages.splice(index, 1);
			this.fakeMessageQueue = messages;
		}

		return Promise.resolve(null);
	}

	// options.accessKeyId
	// options.secretAccessKey
	// options.region
	// options.QueueUrl
	// options.WaitTimeSeconds
	// options.MaxNumberOfMessages
	static create(options) {
		options = options || {};

		return new AwsSqsClient({
			accessKeyId: options.accessKeyId,
			secretAccessKey: options.secretAccessKey,
			region: options.region,
			QueueUrl: options.QueueUrl,
			WaitTimeSeconds: options.WaitTimeSeconds,
			MaxNumberOfMessages: options.MaxNumberOfMessages
		});
	}
}

module.exports = AwsSqsClient;
