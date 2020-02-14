import {assert} from 'chai';

import {rc} from '../../lib';
import * as Behavior from '../../lib';

describe('Predicate', function() {
	it('Turns truth into success', function() {
		const p = new Behavior.Predicate('test', () => true);
		assert.strictEqual(p.handleEvent({__blueshell: {}}, {}), rc.SUCCESS);
	});
	it('Turns false into failure', function() {
		const p = new Behavior.Predicate('test', () => false);
		assert.strictEqual(p.handleEvent({__blueshell: {}}, {}), rc.FAILURE);
	});
});
