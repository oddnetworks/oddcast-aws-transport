'use strict';
var util = require('util');
var EventEmitter = require('events');
var AWS = require('aws-sdk');
var utils = require('./utils');
var errors = require('./errors');

// spec.topicArn
// spec.region
// spec.accessKeyId
// spec.secretAccessKey
function SNSBroadcastEmitter(spec) {
	EventEmitter.call(this);
	this.topicArn = spec.topicArn;
	this.sns = new AWS.SNS({
		apiVersion: '2010-03-31',
		region: spec.region,
		accessKeyId: spec.accessKeyId,
		secretAccessKey: spec.secretAccessKey
	});
}

util.inherits(SNSBroadcastEmitter, EventEmitter);

module.exports = SNSBroadcastEmitter;

utils.extend(SNSBroadcastEmitter.prototype, {
	write: function (message) {
		var self = this;
		var pattern = message.pattern;
		var payload = message.payload;
		var params = {
			TopicArn: this.topicArn,
			Message: JSON.stringify(payload),
			MessageAttributes: {
				pattern: {
					DataType: 'String',
					StringValue: JSON.stringify(pattern)
				}
			}
		};

		if (Buffer.byteLength(params.Message) >= 262144) {
			this.emit('error', new errors.BadRequestError(
				'Messages must be UTF-8 encoded Strings less than 256KB in size'));
			return true;
		}

		this.sns.publish(params, function (err, res) {
			if (err) {
				return self.emit('error', err);
			}
			self.emit('message:published', res);
		});

		return true;
	}
});

// options.topicArn
// options.region
// options.accessKeyId
// options.secretAccessKey
SNSBroadcastEmitter.create = function (options) {
	options = options || Object.create(null);

	var topicArn = options.topicArn;
	if (!topicArn || typeof topicArn !== 'string') {
		throw new Error(
			'sns-broadcast-emitter options requires a topicArn String');
	}
	var region = options.region;
	if (!region || typeof region !== 'string') {
		throw new Error(
			'sns-broadcast-emitter options requires a region String');
	}
	var accessKeyId = options.accessKeyId;
	if (!accessKeyId || typeof accessKeyId !== 'string') {
		throw new Error(
			'sns-broadcast-emitter options requires an accessKeyId String');
	}
	var secretAccessKey = options.secretAccessKey;
	if (!secretAccessKey || typeof secretAccessKey !== 'string') {
		throw new Error(
			'sns-broadcast-emitter options requires an secretAccessKey String');
	}
	return new SNSBroadcastEmitter(options);
};
