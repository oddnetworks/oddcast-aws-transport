'use strict';

const SNSTransport = require('./sns/sns-transport');
const SQSTransport = require('./sqs/sqs-transport');

exports.snsTransport = SNSTransport.create;
exports.sqsTransport = SQSTransport.create;
