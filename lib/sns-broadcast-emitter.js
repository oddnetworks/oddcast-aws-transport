'use strict';

var Promise = require('bluebird');
var AWS = require('aws-sdk');
var errors = require('./errors');

// options.topicArn
// options.region
// options.accessKeyId
// options.secretAccessKey
module.exports = function (options) {
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

	var sns = new AWS.SNS({
		apiVersion: '2010-03-31',
		region: region,
		accessKeyId: accessKeyId,
		secretAccessKey: secretAccessKey
	});

	return function createSNSBroadcastEmmitter() {
		var self = Object.create(null);

		self.broadcast = function (pattern, payload) {
			var params = {
				TopicArn: topicArn,
				Message: JSON.stringify(payload),
				MessageAttributes: {
					pattern: {
						DataType: 'String',
						StringValue: JSON.stringify(pattern)
					}
				}
			};

			if (Buffer.byteLength(params.Message) >= 262144) {
				throw new errors.BadRequestError(
					'Messages must be UTF-8 encoded Strings less than 256KB in size');
			}

			return new Promise(function (resolve, reject) {
				sns.publish(params, function (err) {
					if (err) {
						return reject(err);
					}
					return resolve(true);
				});
			});
		};

		return self;
	};
};
