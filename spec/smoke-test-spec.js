'use strict';

describe('smoke test', () => {
	let subject;

	beforeAll(function (done) {
		const n = null;

		return Promise.resolve(null)
			.then(() => {
				subject = 'foo';
			})
			.then(() => {
				return n.close();
			})
			.catch(done.fail)
			.then(done);
	});

	it('should be "foo"', function () {
		expect(subject).toBe('foo');
	});
});
