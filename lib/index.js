'use strict';

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
