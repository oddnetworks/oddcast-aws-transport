'use strict';

const EventEmitter = require('events');
const Promise = require('bluebird');
const Server = require('./server');
const AwsSnsClient = require('./aws-sns-client');

const DEFAULT_HOSTNAME = 'localhost';
const DEFAULT_PORT = 8686;

class SNSTransport extends EventEmitter {
	constructor(options) {
		super();

		this.server = new Server({
			hostname: options.server.hostname,
			port: options.server.port
		});

		this.awsSnsClient = new AwsSnsClient({
			topicArn: options.sns.topicArn,
			accessKeyId: options.sns.accessKeyId,
			secretAccessKey: options.sns.secretAccessKey,
			region: options.sns.region,
			endpoint: options.sns.endpoint
		});
	}

	initialize() {
		const that = this;
		const server = this.server;

		server.on('message', this.handleIncomingMessage.bind(this));

		return new Promise((resolve, reject) => {
			server.start(err => {
				if (err) {
					return reject(err);
				}
				resolve(that);
			});
		});
	}

	handleIncomingMessage(message) {
		this.emit('log', {level: 'info', message: 'received sns event', context: {message}});

		let payload;
		let pattern;
		try {
			payload = JSON.parse(message.Message);
			pattern = JSON.parse(message.MessageAttributes.pattern.Value);
		} catch (err) {
			this.emit('error', new Error(`Oddcast message JSON parsing error: ${err.message}`));
			return;
		}

		this.emit('data', {pattern, payload});
	}

	write(message) {
		const pattern = message.pattern;
		const payload = typeof message.payload === 'undefined' ? null : message.payload;

		return this.awsSnsClient.publish(pattern, payload).then(() => {
			this.emit('log', {level: 'info', message: 'SNS transport message sent', context: {pattern, payload}});
		});
		// If we return a promise here, oddcast will catch errors itself.
		// .catch(err => {
		// 	this.emit('error', err);
		// });
	}

	// options.server
	//   .hostname - String (default="localhost")
	//   .port - Number (default=8686)
	// options.sns
	//   .accessKeyId - String
	//   .secretAccessKey - String
	//   .region - AWS region String
	//   .topicArn - AWS SNS topic ARN String
	//   .endpoint - The endpoint URL for sending fake events. If this is
	//               present, then the real AWS SNS connection will not be setup.
	static create(options) {
		options = options || {};
		const server = options.server || {};
		const sns = options.sns || {};

		if (!sns.endpoint) {
			if (!sns.accessKeyId) {
				throw new Error(`SNSTransport requires options.sns.accessKeyId String.`);
			}
			if (!sns.secretAccessKey) {
				throw new Error(`SNSTransport requires options.sns.secretAccessKey String.`);
			}
			if (!sns.region) {
				throw new Error(`SNSTransport requires options.sns.region String.`);
			}
			if (!sns.topicArn) {
				throw new Error(`SNSTransport requires options.sns.topicArn String.`);
			}
		}

		const snsOptions = {
			topicArn: sns.endpoint ? null : sns.topicArn,
			accessKeyId: sns.endpoint ? null : sns.accessKeyId,
			secretAccessKey: sns.endpoint ? null : sns.secretAccessKey,
			region: sns.endpoint ? null : sns.region,
			endpoint: sns.endpoint
		};

		const serverOptions = {
			hostname: server.hostname || DEFAULT_HOSTNAME,
			port: server.port || DEFAULT_PORT
		};

		return new SNSTransport({
			server: serverOptions,
			sns: snsOptions
		});
	}
}

module.exports = SNSTransport;
