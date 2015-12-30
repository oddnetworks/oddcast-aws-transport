'use strict';
var util = require('util');
var EventEmitter = require('events');
var Promise = require('bluebird');
var AWS = require('aws-sdk');
var utils = require('./utils');
var SQSLongPoll = require('./sqs-long-poll');

// options.queueUrl
// options.region
// options.accessKeyId
// options.secretAccessKey
// options.debug
function SQSCommandListener(spec) {
	EventEmitter.call(this);
	this.listening = false;
	this.handler = null;
	this.sqs = null;
	this.queueUrl = spec.queueUrl;
	this.debug = spec.debug;
	this.sqs = new AWS.SQS({
		apiVersion: '2012-11-05',
		region: spec.region,
		accessKeyId: spec.accessKeyId,
		secretAccessKey: spec.secretAccessKey
	});
	this.longPoll = SQSLongPoll.create({
		sqs: this.sqs,
		queueUrl: this.queueUrl,
		debug: this.debug
	});
}

util.inherits(SQSCommandListener, EventEmitter);

module.exports = SQSCommandListener;

utils.extend(SQSCommandListener.prototype, {
	resume: function () {
		if (this.listening) {
			return this;
		}

		this.listening = true;
		var self = this;

		this.longPoll.on('message:received', function (message) {
			var messageJSON = message.toJSON();
			self.emit('message:received', messageJSON);
			var result = Promise.resolve(false);
			if (self.handler) {
				result = self.handler({
					pattern: message.pattern,
					payload: message.payload
				});
			}

			result
				.then(function (result) {
					if (result === false) {
						self.emit('message:ignored', messageJSON);
					} else {
						self.deleteMessage(message);
						self.emit('message:handled', messageJSON);
					}
				})
				.catch(function (err) {
					self.emit('message:error', err);
				});
		});

		this.longPoll.on('error', function (error) {
			self.emit('error', error);
		});

		this.longPoll.start();
	},

	deleteMessage: function (message) {
		var self = this;
		var params = {
			QueueUrl: this.queueUrl,
			ReceiptHandle: message.ReceiptHandle
		};
		this.sqs.deleteMessage(params, function (err) {
			if (err) {
				self.emit('error', err);
			} else {
				self.emit('message:deleted', message.toJSON());
			}
		});
	},

	setHandler: function (handler) {
		this.handler = handler;
	},

	close: function () {
		this.longPoll.stop();
	}
});

// options.queueUrl
// options.region
// options.accessKeyId
// options.secretAccessKey
// options.debug
SQSCommandListener.create = function (options) {
	options = options || Object.create(null);

	var queueUrl = options.queueUrl;
	if (!queueUrl || typeof queueUrl !== 'string') {
		throw new Error(
			'sqs-command-listener options requires a queueUrl String');
	}
	var region = options.region;
	if (!region || typeof region !== 'string') {
		throw new Error(
			'sqs-command-listener options requires a region String');
	}
	var accessKeyId = options.accessKeyId;
	if (!accessKeyId || typeof accessKeyId !== 'string') {
		throw new Error(
			'sqs-command-listener options requires an accessKeyId String');
	}
	var secretAccessKey = options.secretAccessKey;
	if (!secretAccessKey || typeof secretAccessKey !== 'string') {
		throw new Error(
			'sqs-command-listener options requires an secretAccessKey String');
	}

	var debugEnabled = Boolean(options.debug);

	return new SQSCommandListener({
		queueUrl: queueUrl,
		region: region,
		accessKeyId: accessKeyId,
		secretAccessKey: secretAccessKey,
		debug: debugEnabled
	});
};
