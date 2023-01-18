import { assert } from 'chai';

import { rc } from '../../lib';
import * as Behavior from '../../lib';

describe('Success', function () {
	it('Returns success, default name', function () {
		const success = new Behavior.Constant(rc.SUCCESS);
		assert.strictEqual(success.handleEvent({ __blueshell: {} }, {}), rc.SUCCESS);
		assert.strictEqual(success.name, rc.SUCCESS);
	});

	it('Returns failure, custom name', function () {
		const name = 'myname';
		const failure = new Behavior.Constant(rc.FAILURE, name);
		assert.strictEqual(failure.handleEvent({ __blueshell: {} }, {}), rc.FAILURE);
		assert.strictEqual(failure.name, name);
	});
});
