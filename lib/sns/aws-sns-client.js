'use strict';

const AWS = require('aws-sdk');
const lib = require('../');
const Client = require('./client');

class AwsSnsClient {
	constructor(options) {
		this.topicArn = null;
		this.sns = null;

		if (options.topicArn && options.accessKeyId && options.secretAccessKey && options.region) {
			this.topicArn = options.topicArn;
			this.sns = new AWS.SNS({
				accessKeyId: options.accessKeyId,
				secretAccessKey: options.secretAccessKey,
				apiVersion: '2010-03-31',
				region: options.region
			});
		} else if (options.endpoint) {
			this.client = new Client({endpoint: options.endpoint});
		} else {
			throw new Error('AwsSnsClient missing required configuration options');
		}
	}

	publish(pattern, payload) {
		if (this.sns) {
			const sns = this.sns;

			const params = {
				TopicArn: this.topicArn,
				Message: JSON.stringify(payload),
				MessageAttributes: {
					pattern: {
						DataType: 'String',
						StringValue: JSON.stringify(pattern)
					}
				}
			};

			return new Promise((resolve, reject) => {
				sns.publish(params, (err, data) => {
					if (err) {
						return reject(err);
					}
					// {
					//   "ResponseMetadata": {
					//     "RequestId": "b39e9d8e-bf22-5405-b82a-cd5085413d37"
					//   },
					//   "MessageId": "319a7f8f-d960-51d7-b69f-2f51e303c8e5"
					// }
					return resolve(data);
				});
			});
		}

		const fakeBody = {
			Type: 'Notification',
			MessageId: lib.genFakeGuid(),
			TopicArn: 'arn:aws:sns:region:id:fake',
			Message: JSON.stringify(payload),
			Timestamp: new Date().toISOString(),
			SignatureVersion: '1',
			Signature: 'fake+signature',
			SigningCertURL: '',
			UnsubscribeURL: '',
			MessageAttributes: {pattern: {
				Type: 'String',
				Value: JSON.stringify(pattern)
			}}
		};

		return this.client.sendMessage(fakeBody).then(res => {
			if (res.statusCode !== 200) {
				throw new Error(`Unknown SNS listener status code: ${res.statusCode}`);
			}

			return {
				ResponseMetadata: {RequestId: lib.genFakeGuid()},
				MessageId: fakeBody.MessageId
			};
		});
	}
}

module.exports = AwsSnsClient;
