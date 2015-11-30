'use strict';

var EventEmitter = require('events');
var Promise = require('bluebird');
var BRIXX = require('brixx');
var AWS = require('aws-sdk');
var lib = require('./');
var SQSLongPoll = require('./sqs-long-poll');

var Mixins = Object.create(null);

// options.queueURL
// options.region
// options.accessKeyId
// options.secretAccessKey
// options.debug
module.exports = function (options) {
	options = options || Object.create(null);

	var queueURL = options.queueURL;
	if (!queueURL || typeof queueURL !== 'string') {
		throw new Error(
			'sqs-command-listener options requires a queueURL String');
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

	var sqs = new AWS.SQS({
		apiVersion: '2012-11-05',
		region: region,
		accessKeyId: accessKeyId,
		secretAccessKey: secretAccessKey
	});

	var factory = BRIXX.factory(Mixins.CommandListener);

	return function createSQSCommandListener(matcher) {
		return factory({
			matcher: matcher,
			sqs: sqs,
			queueURL: queueURL,
			debug: debugEnabled
		});
	};
};

module.exports.Mixins = Mixins;

Mixins.CommandListener = lib.inherits(EventEmitter.prototype, {
	// spec.matcher
	// spec.sqs
	// spec.queueURL
	// spec.debug
	initialize: function (spec) {
		var self = this;

		var longPoll = BRIXX.factory(SQSLongPoll)({
			sqs: spec.sqs,
			queueURL: spec.queueURL,
			debug: spec.debug
		});

		longPoll.on('message:received', function (message) {
			var messageJSON = message.toJSON();
			self.emit('message:received', messageJSON);
			var handler = self.matcher.findSingle(message.pattern);
			var result = Promise.resolve(false);
			if (handler) {
				try {
					result = Promise.resolve(handler(message.payload));
				} catch (err) {
					result = Promise.reject(err);
				}
			}

			result
				.then(function (result) {
					if (result === false) {
						self.emit('message:ignored', messageJSON);
					} else {
						self.longPoll.deleteMessage(message);
						self.emit('message:handled', messageJSON);
					}
				})
				.catch(function (err) {
					self.emit('error', err);
					self.emit('message:error', messageJSON);
				});
		});

		longPoll.on('message:deleted', function (message) {
			self.emit('message:deleted', message.toJSON());
		});

		longPoll.on('error', function (error) {
			self.emit('error', error);
		});

		Object.defineProperties(this, {
			sqs: {
				value: spec.sqs
			},
			longPoll: {
				value: longPoll
			},
			matcher: {
				value: spec.matcher
			}
		});
	},

	addHandler: function (pattern, handler) {
		var added = this.matcher.addSingle(pattern, handler);
		if (added) {
			this.longPoll.start();
		}
		return Promise.resolve(added);
	},

	removeHandler: function (pattern, handler) {
		return Promise.resolve(this.matcher.removeSingle(pattern, handler));
	},

	destroy: function () {
		this.longPoll.stop();
	}
});
