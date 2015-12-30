var AWS = require('aws-sdk');

console.error('key: %s', process.env.ACCESS_KEY_ID);
console.error('secret: %s', process.env.SECRET_ACCESS_KEY);

var sqs = new AWS.SQS({
	apiVersion: '2012-11-05',
	region: 'us-west-2',
	accessKeyId: process.env.ACCESS_KEY_ID,
	secretAccessKey: process.env.SECRET_ACCESS_KEY
});

var options = {
	QueueUrl: 'https://sqs.us-west-2.amazonaws.com/654728787792/experimental',
	WaitTimeSeconds: 5,
	MaxNumberOfMessages: 1,
	AttributeNames: ['All'],
	MessageAttributeNames: ['pattern']
};

sqs.receiveMessage(options, function (err, res) {
	if (err && err.message === 'CrendentialsError') {
		console.error('Missing crendentials');
		return;
	}
	if (err) {
		console.error(err.stack || err.message || err);
		return;
	}

	// No messages:
	// { ResponseMetadata: { RequestId: '5cb3175a-ca68-5ae4-84c5-59d1d0b83f41' } }
	//
	// With messages:
	// {
	// ResponseMetadata: { RequestId: 'a35c2357-5b85-545c-8da4-6ddc7e9562c1' },
	// Messages:
	//  [ { MessageId: '453d606f-0c07-4cd4-add8-bcb13a2f3ac9',
	//      ReceiptHandle: 'ko7IPxuzWR1PzW4d... (length: 348)',
	//      MD5OfBody: '644e3f292b320d2e43a9fab68dd1ca76',
	//      Body: '{"rid":null}' } ]
	// }

	var messages = res.Messages || [];
	console.log('got %d messages', messages.length);
	messages.forEach(function (msg) {
		console.log(msg.ReceiptHandle.slice(0, 76), '...');
		processMessage(msg);
	});
});

function processMessage(msg) {
	console.log(msg);
	// Message from SNS
	// ----------------
	// { MessageId: '67f78cd8-e937-49f8-b768-8317dca7f5bc',
	//   ReceiptHandle: 'AQEB1p0i/F99u6VbFtt7Ed48PDjQ8ybr0+xu920+TLYCgoQT3fK3ZaMFRhVfABZqrdOd2KDW29+0/aT0i+nsRmdvT8HtRiwAeeoAJj7lig8rY25Zx7ldgOWhQfwp/ZcVHg5+nVd95/uROtgDSZvom6nowDiVOfRdLMmKCdkPytbSzOgFIKHW6di0Zu/mh6ExYKd1g/WwkUT5UJhDNTHIlWiILl8neQzXNWCmoI0ipdlcW/AvkaMEVR66C5b9OaZS0EYA4f1L8AZ+TwBhNGAH/5f7xfsmsykwX44PPC8MJlFnBcnJ+ZYQUgBIytoMwkNKkHTzeMx4Yh+MNXTguw2Rgpxhjg==',
	//   MD5OfBody: '7f57108070101e8c6cfb008c8e0a206a',
	//   Body: '{\n  "Type" : "Notification",\n  "MessageId" : "8a0ba019-e563-5ab0-835e-eed2c72c12a6",\n  "TopicArn" : "arn:aws:sns:us-west-2:654728787792:r-and-d-events-transport",\n  "Message" : "{\\"foo\\":\\"bar\\"}",\n  "Timestamp" : "2015-11-22T01:53:19.704Z",\n  "SignatureVersion" : "1",\n  "Signature" : "WFGlVTuBf9vZxcEkp4q8yPIPYJ7KuQ+knCA/8fd8I0Gbmv/jZg9TCEuaAZ33ZRrjF0hX9fNZGCGOzylj8mN6neqITiXheQ3hItyUDvkog6P8IrC8ztMSMgRrwlESJN01nr3kuOq5sqsmN0EIVEKdhqw4dfz+w6uEe25NjGufIyrStXpGekQ/SeXznJ2cOG4R6DVZe9YkJC2oCircnDZ84GNDUHchNQKEEiBkoIZbQc3J2UaDQhVoH38JVsZtHtNN4Hl51ttaUseKfiJ+0Z6ZXlz6IPSjS2YQqCW7DJUX+nkJMXBxHx+Joy3IoKuR1hsoeoiHHbIxQqYPDDMKzIJ1FA==",\n  "SigningCertURL" : "https://sns.us-west-2.amazonaws.com/SimpleNotificationService-bb750dd426d95ee9390147a5624348ee.pem",\n  "UnsubscribeURL" : "https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-west-2:654728787792:r-and-d-events-transport:47072c3b-4dd2-48b8-a897-afda644a6bbb",\n  "MessageAttributes" : {\n    "pattern" : {"Type":"String","Value":"{\\"role\\":\\"logging\\"}"}\n  }\n}',
	//   Attributes:
	//   { SenderId: 'AIDAIYLAVTDLUXBIEIX46',
	//     ApproximateFirstReceiveTimestamp: '1448159995491',
	//     ApproximateReceiveCount: '3',
	//     SentTimestamp: '1448157199780'
	//   }
	// }

	var options = {
		QueueUrl: 'https://sqs.us-west-2.amazonaws.com/654728787792/experimental',
		ReceiptHandle: msg.ReceiptHandle
	};

	sqs.deleteMessage(options, function (err) {
		if (err && err.message === 'CrendentialsError') {
			console.error('Missing crendentials');
			return;
		}
		if (err) {
			console.error(err.stack || err.message || err);
			return;
		}

		// res
		// { ResponseMetadata: { RequestId: '3d7aa72e-4ec1-5c7b-961f-e9a5619f0480' } }
		console.log('deleted %s', msg.MessageId);
	});
}
