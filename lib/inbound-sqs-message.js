var errors = require('./errors');

// spec.MessageId
// spec.ReceiptHandle
// spec.MD5OfBody
// spec.Body
// spec.Attributes
exports.initialize = function (spec) {
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
					message = this.deserializeMessage();
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
};

exports.deserializeMessage = function () {
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
};

exports.toJSON = function () {
	return {
		MessageId: this.MessageId,
		ReceiptHandle: this.ReceiptHandle,
		MD5OfBody: this.MD5OfBody,
		Body: this.Body,
		Attributes: this.Attributes,
		pattern: this.pattern,
		payload: this.payload
	};
};
