'use strict';

const EventEmitter = require('events');
const Promise = require('bluebird');
const AwsSqsClient = require('./aws-sqs-client');

const DEFAULT_POLLING_INTERVAL = 20;
const DEFAULT_WAIT_TIME = 100;
const DEFAULT_MAX_MESSAGES = 3;

class SQSTransport extends EventEmitter {
	constructor(options) {
		super();

		this.awsSqsClient = AwsSqsClient.create({
			accessKeyId: options.accessKeyId,
			secretAccessKey: options.secretAccessKey,
			region: options.region,
			QueueUrl: options.QueueUrl,
			WaitTimeSeconds: typeof options.WaitTimeSeconds === 'number' ? options.WaitTimeSeconds : DEFAULT_WAIT_TIME,
			MaxNumberOfMessages: typeof options.MaxNumberOfMessages === 'number' ? options.MaxNumberOfMessages : DEFAULT_MAX_MESSAGES
		});

		this.pollingInterval = typeof options.pollingInterval === 'number' ?
			options.pollingInterval : DEFAULT_POLLING_INTERVAL;

		this.handler = null;
		this.closeHandler = null;

		this.initialized = false;
	}

	initialize() {
		if (this.initialized) {
			return this;
		}
		this.initialized = true;
		this.pollForMessages();
		return this;
	}

	pollForMessages() {
		return this.awsSqsClient.receiveMessage().then(messages => {
			if (messages.length === 0) {
				return this.pollAgain();
			}

			const promises = messages.map(this.handleIncomingMessage.bind(this));

			return Promise.all(promises).catch(err => {
				this.emit('error', err);
				return this.pollAgain();
			});
		});
	}

	deleteMessage(message) {
		return this.awsSqsClient.deleteMessage(message.ReceiptHandle).catch(err => {
			this.emit('error', err);
			return null;
		});
	}

	pollAgain() {
		return Promise.delay(this.pollingInterval * 1000).then(() => {
			// If there is a closeHandler we are done and need to break the loop.
			if (this.closeHandler) {
				this.closeHandler();
			} else {
				this.pollForMessages();
			}

			// Don't return the result of pollForMessages() (which is a Promise). If we do, we'll end
			// up with an infinite stack that will never unwind.
			return null;
		});
	}

	handleIncomingMessage(message) {
		this.emit('log', {level: 'info', message: 'received sqs message', context: {message}});

		let payload;
		let pattern;
		try {
			payload = JSON.parse(message.Message);
			pattern = JSON.parse(message.MessageAttributes.pattern.Value);
		} catch (err) {
			this.emit('error', new Error(`Oddcast message JSON parsing error: ${err.message}`));
			return;
		}

		return this.handler({pattern, payload})
			.catch(() => {
				// Oddcast will have already reported the error, so we can skip it here.
				return false;
			})
			.then(success => {
				if (success) {
					return this.deleteMessage(message.ReceiptHandle);
				}
				return null;
			});
	}

	write(message) {
		const pattern = message.pattern;
		const payload = typeof message.payload === 'undefined' ? null : message.payload;

		return this.awsSqsClient.sendMessage(pattern, payload).then(() => {
			this.emit('log', {level: 'info', message: 'SQS transport message sent', context: {pattern, payload}});
			return null;
		});
		// If we return a promise here, oddcast will catch errors itself.
		// .catch(err => {
		// 	this.emit('error', err);
		// });
	}

	setHandler(handler) {
		this.handler = handler;
	}

	close(callback) {
		callback = typeof callback === 'function' ? callback : function () {};
		this.closeHandler = callback;
		return true;
	}

	// options.accessKeyId - String
	// options.secretAccessKey - String
	// options.region - AWS region String
	// options.QueueUrl - AWS SQS queue URL String.
	// options.WaitTimeSeconds - Number of seconds to wait for new messages when polling (default=100).
	// options.MaxNumberOfMessages - Number of messages to retreive at once (default=3).
	// options.pollingInterval - Number of seconds to wait between polling tries (default=20).
	static create(options) {
		return new SQSTransport(options);
	}
}

module.exports = SQSTransport;
