'use strict';
var util = require('util');
var EventEmitter = require('events');
var utils = require('./utils');
var SQSMessage = require('./inbound-sqs-message');

// spec.sqs
// spec.queueURL
// spec.debug
function SQSLongPoll(spec) {
	EventEmitter.call(this);

	Object.defineProperties(this, {
		sqs: {
			value: spec.sqs
		},
		queueURL: {
			value: spec.queueURL
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
	},

	runLoop: function () {
		var self = this;
		if (this.isRunning) {
			this.request()
				.then(function (message) {
					if (self.isRunning) {
						self.emit('message:received', message);
						self.runLoop();
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
			self.sqs.receiveMessage(self.requestParams, function (err, res) {
				if (err) {
					return reject(err);
				}
				resolve(SQSMessage.create(res));
			});
		});
	},

	getRequestParams: function () {
		var params = {
			QueueURL: this.queueURL,
			MaxNumberOfMessages: 1,
			WaitTimeSeconds: 20
		};
		if (this.debug) {
			params.AttributeNames = ['All'];
		}
		return params;
	}
});

// spec.sqs
// spec.queueURL
// spec.debug
SQSLongPoll.create = function (spec) {
	return new SQSLongPoll(spec);
};
