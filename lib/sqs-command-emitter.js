'use strict';
var util = require('util');
var EventEmitter = require('events');
var AWS = require('aws-sdk');
var utils = require('./utils');

// spec.queueUrl
// spec.region
// spec.accessKeyId
// spec.secretAccessKey
function SQSCommandEmitter(spec) {
	EventEmitter.call(this);

	this.queueUrl = spec.queueUrl;

	this.sqs = new AWS.SQS({
		apiVersion: '2012-11-05',
		region: spec.region,
		accessKeyId: spec.accessKeyId,
		secretAccessKey: spec.secretAccessKey
	});
}

util.inherits(SQSCommandEmitter, EventEmitter);

module.exports = SQSCommandEmitter;

utils.extend(SQSCommandEmitter.prototype, {
	write: function (message) {
		var self = this;
		var options = {
			QueueUrl: this.queueUrl,
			MessageBody: JSON.stringify(message.payload),
			MessageAttributes: {
				pattern: {
					DataType: 'String',
					StringValue: JSON.stringify(message.pattern)
				}
			}
		};
		this.sqs.sendMessage(options, function (err, res) {
			if (err) {
				self.emit('error', err);
			} else {
				self.emit('message:sent', res);
			}
		});
	}
});

// options.queueUrl
// options.region
// options.accessKeyId
// options.secretAccessKey
SQSCommandEmitter.create = function (options) {
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
	return new SQSCommandEmitter({
		queueUrl: queueUrl,
		region: region,
		accessKeyId: accessKeyId,
		secretAccessKey: secretAccessKey
	});
};
