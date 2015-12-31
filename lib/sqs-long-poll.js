'use strict';
var util = require('util');
var EventEmitter = require('events');
var utils = require('./utils');
var SQSMessage = require('./inbound-sqs-message');

// spec.sqs
// spec.queueUrl
// spec.debug
function SQSLongPoll(spec) {
	EventEmitter.call(this);

	Object.defineProperties(this, {
		sqs: {
			value: spec.sqs
		},
		queueUrl: {
			value: spec.queueUrl
		},
		debug: {
			value: Boolean(spec.debug)
		},
		requestParams: {
			get: this.getRequestParams
		},
		isRunning: {
			writable: true,
			value: false
		},
		isClosed: {
			writable: true,
			value: false
		},
		requestsPending: {
			value: []
		}
	});
}

module.exports = SQSLongPoll;

util.inherits(SQSLongPoll, EventEmitter);

utils.extend(SQSLongPoll.prototype, {
	start: function () {
		if (!this.isRunning) {
			this.isRunning = true;
			this.runLoop();
		}
	},

	stop: function () {
		this.isRunning = false;
		this.close();
	},

	close: function () {
		if (this.requestsPending.length === 0 && !this.isClosed) {
			this.isClosed = true;
			this.emit('close');
		}
	},

	runLoop: function () {
		var self = this;
		if (this.isRunning) {
			this.request()
				.then(function (messages) {
					if (self.isRunning) {
						messages.forEach(function (rawMessage, i) {
							var message = SQSMessage.create(rawMessage);
							setTimeout(function () {
								self.emit('message:received', message);
							}, 10 * i);
						});
						self.runLoop();
					} else {
						self.close();
					}
				})
				.catch(function (err) {
					self.stop();
					self.emit('error', err);
				});
		}
	},

	request: function () {
		var self = this;
		return new Promise(function (resolve, reject) {
			self.requestsPending.push(1);
			self.sqs.receiveMessage(self.requestParams, function (err, res) {
				self.requestsPending.shift();
				if (err) {
					return reject(err);
				}
				resolve(res.Messages || []);
			});
		});
	},

	getRequestParams: function () {
		var params = {
			QueueUrl: this.queueUrl,
			MaxNumberOfMessages: 1,
			WaitTimeSeconds: 20,
			MessageAttributeNames: ['pattern']
		};
		if (this.debug) {
			params.AttributeNames = ['All'];
		}
		return params;
	}
});

// spec.sqs
// spec.queueUrl
// spec.debug
SQSLongPoll.create = function (spec) {
	return new SQSLongPoll(spec);
};
