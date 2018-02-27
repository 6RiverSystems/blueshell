/**
 * Created by josh on 3/30/16.
 */

import {assert} from 'chai';

import {resultCodes as rc} from '../../lib/utils/resultCodes';
import {RobotState, waitAi} from './test/RobotActions';

describe('Composite', function() {
	context('#resetNodeStorage', function() {
		it('should reset child state', function() {
			const event = '';
			const state = new RobotState(false);

			state.overheated = true;

			return waitAi.handleEvent(state, event)
			.catch((err: Error) => {
				console.error(err.stack);
				throw err;
			})
			.then((res: string) => {
				// assert state of child
				assert.equal(res, rc.RUNNING);
				assert.equal(state.batteryLevel, 1);
				assert.equal(state.cooldownLevel, 1);

				// reset state
				waitAi.resetNodeStorage(state);
			})
			.then(() => waitAi.handleEvent(state, event))
			.then((res: string) => {
				// assert state of child again
				assert.equal(res, rc.RUNNING);
				assert.equal(state.batteryLevel, 2);

				// Normally would be 0
				assert.equal(state.cooldownLevel, 1);
			});
		});
	});
});
