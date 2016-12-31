'use strict';

const crypto = require('crypto');

exports.genFakeGuid = function () {
	const chars = '0123456789abcdef';

	function rand(length) {
		let str = '';
		for (let i = 0; i < length; i += 1) {
			str += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return str;
	}

	return `${rand(8)}-${rand(4)}-${rand(4)}-${rand(4)}-${rand(12)}`;
};

exports.md5 = function (str) {
	const hash = crypto.createHash('md5');
	hash.update(str);
	return hash.digest('hex');
};
