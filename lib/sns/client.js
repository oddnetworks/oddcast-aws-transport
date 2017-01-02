'use strict';

const http = require('http');
const https = require('https');
const url = require('url');
const Promise = require('bluebird');

class Client {
	// options.endpoints - Array of Strings (full HREF URLs)
	constructor(options) {
		this.endpoints = options.endpoints.map(endpoint => {
			const parsedUrl = url.parse(endpoint);
			return {
				protocol: parsedUrl.protocol,
				hostname: parsedUrl.hostname,
				port: parsedUrl.port,
				path: parsedUrl.path
			};
		});
	}

	sendSubscriptionRequest(body, options) {
		options = options || {};

		const params = {
			method: 'POST',
			protocol: options.protocol || this.protocol,
			hostname: options.hostname || this.hostname,
			port: options.port || this.port,
			path: options.path || this.path,
			json: body
		};

		return Client.request(params);
	}

	sendMessage(body) {
		const promises = this.enpoints.map(endpoint => {
			const params = {
				method: 'POST',
				headers: {
					'x-amz-sns-message-type': body.Type,
					'x-amz-sns-message-id': body.MessageId
				},
				protocol: endpoint.protocol,
				hostname: endpoint.hostname,
				port: endpoint.port,
				path: endpoint.path,
				json: body
			};

			return Client.request(params);
		});

		return Promise.all(promises);
	}

	static sendSubscriptionConfirmation(confirmationUrl) {
		const parsedUrl = url.parse(confirmationUrl);

		const params = {
			method: 'GET',
			protocol: parsedUrl.protocol,
			hostname: parsedUrl.hostname,
			path: parsedUrl.path
		};

		return this.request(params);
	}

	// args.method - ex: 'GET' *required
	// args.headers - Object
	// args.protocol - ex: 'https' (default="http")
	// args.hostname - ex: 'www.google.com' *required
	// args.port - Number (default=80 | 443)
	// args.path - ex: "/foo/bar?foo=bar"
	// args.json - Anything that can be JSON.stringify()'d
	static request(args) {
		const params = {
			method: args.method,
			protocol: args.protocol || 'http',
			hostname: args.hostname,
			headers: {
				'User-Agent': 'Oddcast AWS SNS Agent'
			}
		};

		if (args.headers) {
			Object.assign(params.headers, args.headers);
		}

		if (args.port) {
			params.port = args.port;
		}

		if (args.path) {
			params.path = args.path;
		}

		let json;
		if (params.json) {
			json = JSON.stringify(params.json);
			params.headers['Content-Type'] = 'application/json';
			params.headers['Content-Length'] = Buffer.byteLength(json);
		}

		const protocol = params.protocol === 'https' ? https : http;

		return new Promise((resolve, reject) => {
			const req = protocol.request(params, res => {
				let body = '';
				res.setEncoding('utf8');

				res.on('data', data => {
					body += data;
				});

				res.on('end', () => {
					res.body = body;
					resolve(res);
				});
			});

			req.on('error', reject);

			if (json) {
				req.write(json);
			}

			req.end();
		});
	}
}

module.exports = Client;
