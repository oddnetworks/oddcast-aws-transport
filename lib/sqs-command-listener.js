'use strict';

var EventEmitter = require('events');
var Promise = require('bluebird');
var BRIXX = require('brixx');
var AWS = require('aws-sdk');
var lib = require('./');
var errors = require('./errors');

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

		var longPoll = BRIXX.factory(Mixins.LongPoll)({
			sqs: spec.sqs,
			queueURL: spec.queueURL,
			debug: spec.debug
		});

		longPoll.on('message:received', function (message) {
			var messageJSON = message.toJSON();
			self.emit('message:received', messageJSON);
			var handler = self.matcher.findSingle(message.pattern);
			if (handler) {
				message.receive(handler)
					.then(function (wasHandled) {
						if (wasHandled) {
							self.emit('message:handled', messageJSON);
						} else {
							self.emit('message:rejected', messageJSON);
						}
					})
					.catch(function (error) {
						self.emit('error', error);
					});
			} else {
				self.emit('message:ignored', messageJSON);
			}
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
				value: spec.longPoll
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
	}
});

Mixins.LongPoll = lib.inherits(EventEmitter.prototype, {
	// spec.sqs
	// spec.queueURL
	// spec.debug
	initialize: function (spec) {
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
	},

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

				var message = BRIXX.factory(Mixins.Message)(res);
				message.ondelete = function () {
					var params = {
						QueueURL: self.queueURL,
						ReceiptHandle: message.ReceiptHandle
					};
					self.sqs.deleteMessage(params, function (err) {
						if (err) {
							self.emit('error', err);
						} else {
							self.emit('message:deleted', message);
						}
					});
				};

				resolve(message);
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

Mixins.Message = {
	// spec.MessageId
	// spec.ReceiptHandle
	// spec.MD5OfBody
	// spec.Body
	// spec.Attributes
	initialize: function (spec) {
		var message;

		Object.defineProperties(this, {
			MessageId: {
				value: spec.MessageId
			},
			ReceiptHandle: {
				value: spec.ReceiptHandle
			},
			MD5OfBody: {
				value: spec.MD5OfBody
			},
			Body: {
				value: spec.Body
			},
			Attributes: {
				value: spec.Attributes || null
			},
			message: {
				get: function () {
					if (!message) {
						message = this.getMessage();
					}
					return message;
				}
			},
			pattern: {
				enumerable: true,
				get: function () {
					return this.message.pattern;
				}
			},
			payload: {
				enumerable: true,
				get: function () {
					return this.message.payload;
				}
			}
		});
	},

	receive: function (handler) {
		var self = this;
		var promise;

		try {
			promise = Promise.resolve(handler(this.payload));
		} catch (err) {
			promise = Promise.reject(err);
		}

		return promise.then(function (res) {
			if (res !== false) {
				self.ondelete();
				return true;
			}
			return false;
		});
	},

	getMessage: function () {
		var body;
		try {
			body = JSON.parse(this.Body);
		} catch (e) {
			throw new errors.JSONParseError('JSON SyntaxError: ' + e.message +
																			' in SQS message Body');
		}
		if (body.pattern && body.payload) {
			return body;
		}
		// If the message came from SNS, we get a different format.
		if (body.Message &&
				body.MessageAttributes &&
				body.MessageAttributes.pattern) {
			return {
				pattern: JSON.parse(body.MessageAttributes.pattern.Value),
				payload: JSON.parse(body.Message)
			};
		}
		throw new errors.InvalidMessageError(
			'SQS Body does not follow the expected format.');
	},

	toJSON: function () {
		return {
			MessageId: this.MessageId,
			ReceiptHandle: this.ReceiptHandle,
			MD5OfBody: this.MD5OfBody,
			Body: this.Body,
			Attributes: this.Attributes,
			pattern: this.patttern,
			payload: this.payload
		};
	}
};
