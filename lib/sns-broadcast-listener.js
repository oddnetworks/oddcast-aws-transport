'use strict';

var errors = require('./errors');

module.exports = function () {
	var msg = 'SNS Broadcast listener is not implemented';
	throw new errors.NotImplementedError(msg);
};
