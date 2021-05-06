import {assert} from 'chai';

import {rc} from '../../lib';
import * as Behavior from '../../lib';

describe('Error', function() {
	it('Returns error', function() {
		const failure = new Behavior.Error();
		assert.strictEqual(failure.handleEvent({__blueshell: {}}, {}), rc.ERROR);
	});
});
