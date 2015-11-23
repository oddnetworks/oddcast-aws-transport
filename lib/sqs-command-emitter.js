'use strict';

var errors = require('./errors');

module.exports = function () {
	var msg = 'SQS Command emitter is not implemented';
	throw new errors.NotImplementedError(msg);
};
