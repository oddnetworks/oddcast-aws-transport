'use strict';

const EventEmitter = require('events');
const http = require('http');
const Client = require('./client');

class Request {
	constructor(req) {
		this.req = req;
	}

	get(key) {
		return this.req.headers[key] || this.req.headers[key.toLowerCase()];
	}

	parseJsonBody(callback) {
		let postBody = '';
		this.req.setEncoding('utf8');

		this.req.on('data', data => {
			postBody += data;
		});

		this.req.on('end', () => {
			try {
				this.body = JSON.parse(postBody);
			} catch (err) {
				return callback(new Error(`AWS SNS request body JSON parsing error: ${err.message}`));
			}

			callback();
		});
	}
}

class Response {
	constructor(res) {
		this.res = res;
	}

	status(code) {
		this.res.statusCode = code;
	}

	end() {
		this.res.end();
	}
}

class Server extends EventEmitter {
	constructor(options) {
		if (!options.port) {
			throw new Error('Server requires options.port');
		}

		if (!options.hostname) {
			throw new Error('Server requires options.hostname');
		}

		super();

		this.port = options.port;
		this.hostname = options.hostname;
		this.server = null;
	}

	start(callback) {
		this.server = http.createServer((req, res) => {
			const request = new Request(req);
			const response = new Response(res);

			request.parseJsonBody(err => {
				if (err) {
					return this.handleError(err, req, res);
				}

				this.handleRequest(request, response, err => {
					if (err) {
						return this.handleError(err, req, res);
					}

					this.handleError(
						new Error(`next() called unexpectedly without an error`),
						req,
						res
					);
				});
			});
		});

		this.server.on('error', callback);

		this.server.listen(this.port, this.hostname, () => {
			callback(null, this);
		});
	}

	handleRequest(req, res, next) {
		const type = req.get('x-amz-sns-message-type');

		switch (type) {
			case 'SubscriptionConfirmation':
				return this.handleSubscriptionConfirmation(req, res, next);
			case 'Notification':
				return this.handleNotification(req, res, next);
			default:
				return next(new Error(`Unknown SNS message type: "${type}"`));
		}
	}

	handleNotification(req, res, next) {
		try {
			this.emit('message', req.body);
			res.status(200).end();
		} catch (err) {
			next(err);
		}
	}

	handleSubscriptionConfirmation(req, res, next) {
		const subscribeUrl = req.body.SubscribeURL;

		return Client.sendSubscriptionConfirmation(subscribeUrl).then(() => {
			res.status(200).end();
			return null;
		}).catch(next);
	}

	handleError(err, req, res) {
		const body = 'Server error';

		res.writeHead(500, {
			'Content-Type': 'text/plain',
			'Content-Length': Buffer.byteLength(body)
		});

		res.end(body);

		this.emit('log', {level: 'error', message: 'SNS subscription server error', context: {error: err}});
	}
}

module.exports = Server;
