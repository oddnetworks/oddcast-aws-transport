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

		this.awsSnsClient.publish(pattern, payload).then(() => {
			this.emit('log', {level: 'info', message: 'message sent', context: {pattern, payload}});
		}).catch(err => {
			this.emit('error', err);
		});

		return this;
	}

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
