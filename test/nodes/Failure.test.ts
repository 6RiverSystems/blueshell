import {assert} from 'chai';

import {rc} from '../../lib';
import * as Behavior from '../../lib';

describe('Failure', function() {
	it('Returns failure', function() {
		const failure = new Behavior.Failure();
		assert.strictEqual(failure.handleEvent({__blueshell: {}}, {}), rc.FAILURE);
	});
});
