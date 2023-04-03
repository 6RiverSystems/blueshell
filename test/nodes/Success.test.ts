import { assert } from 'chai';

import { rc } from '../../lib';
import * as Behavior from '../../lib';

describe('Success', function () {
	it('Returns success', function () {
		const success = new Behavior.Success();
		assert.strictEqual(success.handleEvent({ __blueshell: {} }, {}), rc.SUCCESS);
	});
});
