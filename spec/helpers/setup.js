'use strict';

beforeAll(function (done) {
	const n = null;

	return Promise.resolve(null)
		.then(() => {
			this.foo = 'bar';
		})
		.then(() => {
			return n.open();
		})
		.catch(done.fail)
		.then(done);
});
