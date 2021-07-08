import {assert} from 'chai';

import {rc} from '../../lib';
import * as Behavior from '../../lib';

describe('SideEffect', function() {
	it('Runs the side effect', function() {
		let x = 1;
		const s = new Behavior.SideEffect('set X', () => {
			x = 3;
		});
		s.handleEvent({__blueshell: {}, nodePath: ''}, {});
		assert.strictEqual(x, 3);
	});
	it('Always succeeds if it completes', function() {
		const s = new Behavior.SideEffect('set X', () => ({}));
		assert.strictEqual(s.handleEvent({__blueshell: {}, nodePath: ''}, {}), rc.SUCCESS);
	});
});
