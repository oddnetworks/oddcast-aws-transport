'use strict';

const Promise = require('bluebird');
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
		} else if (options.endpoints) {
			this.client = new Client({endpoints: options.endpoints});
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
