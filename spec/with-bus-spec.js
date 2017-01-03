/* global describe, beforeAll, afterAll, it, expect */
/* eslint prefer-arrow-callback: 0 */
'use strict';

const Promise = require('bluebird');
const oddcast = require('oddcast');
const AWSTransport = require('../lib/oddcast-aws-transport');

const SQS_OPTIONS = {
	accessKeyId: '',
	secretAccessKey: '',
	region: '',
	QueueUrl: '',
	WaitTimeSeconds: null,
	MaxNumberOfMessages: null,
	pollingInterval: 1
};

const SQS_TRANSPORT = AWSTransport.sqsTransport(SQS_OPTIONS);

describe('with oddcast bus', function () {
	const componentA = {
		bus: oddcast.bus(),
		sqs: SQS_TRANSPORT,
		sns: AWSTransport.snsTransport({
			server: {
				hostname: 'localhost',
				port: 8001
			},
			sns: {
				accessKeyId: '',
				secretAccessKey: '',
				region: '',
				topicArn: '',
				endpoints: [
					'http://locahost:8001',
					'http://locahost:8002',
					'http://locahost:8003'
				]
			}
		}),

		initialize() {
			// Initialize the SNS transport first.
			return this.sns.initialize().then(() => {
				// There is no need to wait for the SQS transport to initialize.
				this.sqs.initialize();
				this.bus.commands.use({role: 'catalog'}, this.sqs);
				this.bus.events.use({role: 'catalog'}, this.sns);
				return this;
			});
		},

		close() {
			const sqsClosed = new Promise(resolve => {
				this.sqs.close(resolve);
			});
			const snsClosed = new Promise(resolve => {
				this.sns.close(resolve);
			});

			return Promise.all([sqsClosed, snsClosed]);
		}
	};

	const componentB = {
		bus: oddcast.bus(),
		sqs: SQS_TRANSPORT,
		sns: AWSTransport.snsTransport({
			server: {
				hostname: 'localhost',
				port: 8002
			},
			sns: {
				accessKeyId: '',
				secretAccessKey: '',
				region: '',
				topicArn: '',
				endpoints: [
					'http://locahost:8001',
					'http://locahost:8002',
					'http://locahost:8003'
				]
			}
		}),

		payloads: [],
		errorEvents: [],
		database: {},

		error: null,

		initialize() {
			this.bus.commands.on('error', err => {
				this.errorEvents.push(err);
			});

			this.bus.events.on('error', err => {
				this.errorEvents.push(err);
			});

			// Initialize the SNS transport first.
			return this.sns.initialize().then(() => {
				// There is no need to wait for the SQS transport to initialize.
				this.sqs.initialize();

				this.bus.commands.use({role: 'catalog'}, this.sqs);
				this.bus.events.use({role: 'catalog'}, this.sns);

				this.bus.commandHandler(
					{role: 'catalog', cmd: 'setVideo'},
					this.commandHandler.bind(this)
				);

				return this;
			});
		},

		commandHandler(payload) {
			this.payloads.push(payload);
			if (!this.error && payload.errorMessage) {
				throw new Error(payload.errorMessage);
			}

			this.database[payload.id] = payload;
		},

		close() {
			const sqsClosed = new Promise(resolve => {
				this.sqs.close(resolve);
			});
			const snsClosed = new Promise(resolve => {
				this.sns.close(resolve);
			});

			return Promise.all([sqsClosed, snsClosed]);
		}
	};

	const componentC = {
		bus: oddcast.bus(),
		sqs: SQS_TRANSPORT,
		sns: AWSTransport.snsTransport({
			server: {
				hostname: 'localhost',
				port: 8003
			},
			sns: {
				accessKeyId: '',
				secretAccessKey: '',
				region: '',
				topicArn: '',
				endpoints: [
					'http://locahost:8001',
					'http://locahost:8002',
					'http://locahost:8003'
				]
			}
		}),

		payloads: [],
		errorEvents: [],
		database: {},

		error: null,

		initialize() {
			this.bus.commands.on('error', err => {
				this.errorEvents.push(err);
			});

			this.bus.events.on('error', err => {
				this.errorEvents.push(err);
			});

			// Initialize the SNS transport first.
			return this.sns.initialize().then(() => {
				// There is no need to wait for the SQS transport to initialize.
				this.sqs.initialize();

				this.bus.commands.use({role: 'catalog'}, this.sqs);
				this.bus.events.use({role: 'catalog'}, this.sns);

				this.bus.commandHandler(
					{role: 'catalog', cmd: 'setImage'},
					this.commandHandler.bind(this)
				);

				return this;
			});
		},

		commandHandler(payload) {
			this.payloads.push(payload);
			if (!this.error && payload.errorMessage) {
				throw new Error(payload.errorMessage);
			}

			this.database[payload.id] = payload;
		},

		close() {
			const sqsClosed = new Promise(resolve => {
				this.sqs.close(resolve);
			});
			const snsClosed = new Promise(resolve => {
				this.sns.close(resolve);
			});

			return Promise.all([sqsClosed, snsClosed]);
		}
	};

	const videos = [1, 2, 3, 4].map(i => {
		const item = {
			id: i.toString(),
			type: 'video',
			url: `http://example.com/videos/${i}`
		};

		if (i === 2) {
			item.errorMessage = 'Video forced error';
		}

		return item;
	});

	const images = [1, 2, 3, 4].map(i => {
		const item = {
			id: i.toString(),
			type: 'image',
			url: `http://example.com/images/${i}`
		};

		if (i === 2) {
			item.errorMessage = 'Image forced error';
		}

		return item;
	});

	const components = [componentA, componentB, componentC];

	beforeAll(function (done) {
		return Promise.resolve(null)

			// Initialize all the components.
			.then(() => {
				console.log('initialize all components');
				return Promise.all(components.map(comp => {
					return comp.initialize();
				}));
			})

			// Send all the setVideo commands
			.then(() => {
				console.log('send all the setVideo commands');
				return Promise.all(videos.map(item => {
					return componentA.bus.sendCommand({role: 'catalog', cmd: 'setVideo'}, item).then(res => {
						console.log(`result ${item.id}:`, res);
						return null;
					}).catch(err => {
						console.log(`ERROR ${item.id}:`, err.message);
						return null;
					});
				}));
			})

			// Send all the setImage commands
			.then(() => {
				return Promise.all(images.map(item => {
					return componentA.bus.sendCommand({role: 'catalog', cmd: 'setImage'}, item);
				}));
			})

			// Fini
			.catch(done.fail)
			.then(done);
	});

	afterAll(function (done) {
		return Promise.resolve(null)

			// Close all the components.
			.then(() => {
				return Promise.all(components.map(comp => {
					return comp.close();
				}));
			})

			// Fini
			.catch(done.fail)
			.then(done);
	});

	describe('component A', function () {
		let subject;

		beforeAll(() => {
			subject = componentA;
		});

		it('has payloads', function () {
			expect(subject.payloads.length).toBe(3);
		});
	});
});
