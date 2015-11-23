'use strict';

exports.inherits = function () {
	var proto = {};
	var mixins = Array.prototype.slice(1);
	return mixins.reduce(function (proto, mixin) {
		return Object.keys(mixin).reduce(function (proto, key) {
			proto[key] = mixin[key];
			return proto;
		}, proto);
	}, proto);
};

exports.snsBroadcastEmitter = require('./sns-broadcast-emitter');
exports.snsBroadcastListener = require('./sns-broadcast-listener');
exports.sqsCommandEmitter = require('./sqs-command-emitter');
exports.sqsCommandListener = require('./sqs-command-listener');
