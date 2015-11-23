var util = require('util');

// A superclass for all other Operational Errors and used by itself
// as a general operational exception indicator.
function OperationalError(message) {
	Error.call(this);
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
}
util.inherits(OperationalError, Error);
exports.Errors.OperationalError = OperationalError;

function NotImplementedError(message) {
	Error.call(this);
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
}
util.inherits(NotImplementedError, OperationalError);
exports.Errors.NotImplementedError = NotImplementedError;

function BadRequestError(message) {
	Error.call(this);
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
}
util.inherits(BadRequestError, OperationalError);
exports.Errors.BadRequestError = BadRequestError;

function JSONParseError(message) {
	Error.call(this);
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
}
util.inherits(JSONParseError, OperationalError);
exports.Errors.JSONParseError = JSONParseError;

function InvalidMessageError(message) {
	Error.call(this);
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
}
util.inherits(InvalidMessageError, OperationalError);
exports.Errors.InvalidMessageError = InvalidMessageError;
