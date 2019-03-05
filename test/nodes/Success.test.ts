import {assert} from 'chai';

import {resultCodes as rc} from '../../lib/utils/resultCodes';

import * as Behavior from '../../lib';

describe('Success', function() {
	it('Returns success', function() {
		const success = new Behavior.Success();
		assert.strictEqual(success.handleEvent({__blueshell: {}}, {}), rc.SUCCESS);
	});
});
