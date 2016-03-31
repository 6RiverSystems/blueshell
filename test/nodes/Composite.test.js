/**
 * Created by josh on 3/30/16.
 */
'use strict';

let assert = require('chai').assert;

let Behavior = require('../../lib');

var TestActions = require('../nodes/test/Actions');

let waitAi = TestActions.waitAi;

describe('Composite', function() {

	context('#resetNodeStorage', function() {

		it('should reset child state', function() {
			let state = TestActions.initialState(false);
			state.overheated = true;

			let event = {};

			return waitAi.handleEvent(state, event)
			.catch((err) => {
				console.error(err.stack);
			})
			.then((res) => {
				// assert state of child
				assert.equal(res.result, 'RUNNING');
				assert.equal(res.state.batteryLevel, 1);
				assert.equal(res.state.cooldownLevel, 1);

				// reset state
				waitAi.resetNodeStorage(state);
			})
			.then(() => waitAi.handleEvent(state, event))
			.then((res) => {
				// assert state of child again
				assert.equal(res.result, 'RUNNING');
				assert.equal(res.state.batteryLevel, 2);

				// Normally would be 0
				assert.equal(res.state.cooldownLevel, 1);
			});

		});
	});
});
