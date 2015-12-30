var utils = require('./utils');
var errors = require('./errors');

// spec.MessageId
// spec.ReceiptHandle
// spec.MD5OfBody
// spec.Body
// spec.MessageAttributes
// spec.Attributes
function InboundSQSMessage(spec) {
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
		MessageAttributes: {
			value: spec.MessageAttributes
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
}

module.exports = InboundSQSMessage;

utils.extend(InboundSQSMessage.prototype, {

	deserializeMessage: function () {
		var body;
		var pattern;
		try {
			body = JSON.parse(this.Body || 'null') || Object.create(null);
		} catch (e) {
			throw new errors.JSONParseError('JSON SyntaxError: ' + e.message +
																			' in SQS message Body');
		}
		if (this.MessageAttributes && this.MessageAttributes.pattern) {
			if (this.MessageAttributes.pattern.StringValue) {
				try {
					pattern = JSON.parse(this.MessageAttributes.pattern.StringValue);
				} catch (e) {
					throw new errors.JSONParseError('JSON SyntaxError: ' + e.message +
																					' in SQS MessageAttributes');
				}
				return {
					pattern: pattern,
					payload: body
				};
			}
			throw new errors.InvalidMessageError(
				'SQS MessageAttributes do not follow the expected format.');
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
			pattern: this.pattern,
			payload: this.payload
		};
	}
});

// spec.MessageId
// spec.ReceiptHandle
// spec.MD5OfBody
// spec.Body
// spec.MessageAttributes
// spec.Attributes
InboundSQSMessage.create = function (spec) {
	return new InboundSQSMessage(spec);
};
