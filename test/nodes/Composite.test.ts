/**
 * Created by josh on 3/30/16.
 */

import { assert } from 'chai';

import { RobotState, waitAi } from './test/RobotActions';
import { rc } from '../../lib';

describe('Composite', function () {
	context('#resetNodeStorage', function () {
		it('should reset child state', function () {
			const event = '';
			const state = new RobotState(false);

			state.overheated = true;

			const res = waitAi.handleEvent(state, event);

			// assert state of child
			assert.equal(res, rc.RUNNING);
			assert.equal(state.batteryLevel, 1);
			assert.equal(state.cooldownLevel, 1);

			// reset state
			waitAi.resetNodeStorage(state);

			const res2 = waitAi.handleEvent(state, event);

			// assert state of child again
			assert.equal(res2, rc.RUNNING);
			assert.equal(state.batteryLevel, 2);

			// Normally would be 0
			assert.equal(state.cooldownLevel, 1);
		});
	});
});
