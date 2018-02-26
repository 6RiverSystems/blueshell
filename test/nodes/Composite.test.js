/**
 * Created by josh on 3/30/16.
 */
'use strict';

const assert = require('chai').assert;

const rc = require('../../lib/utils/resultCodes');

const TestActions = require('../nodes/test/Actions');

const waitAi = TestActions.waitAi;

describe('Composite', function() {
	context('#resetNodeStorage', function() {
		it('should reset child state', function() {
			const event = {};
			const state = TestActions.initialState(false);

			state.overheated = true;

			return waitAi.handleEvent(state, event)
			.catch((err) => {
				console.error(err.stack);
			})
			.then((res) => {
				// assert state of child
				assert.equal(res, rc.RUNNING);
				assert.equal(state.batteryLevel, 1);
				assert.equal(state.cooldownLevel, 1);

				// reset state
				waitAi.resetNodeStorage(state);
			})
			.then(() => waitAi.handleEvent(state, event))
			.then((res) => {
				// assert state of child again
				assert.equal(res, rc.RUNNING);
				assert.equal(state.batteryLevel, 2);

				// Normally would be 0
				assert.equal(state.cooldownLevel, 1);
			});
		});
	});
});
