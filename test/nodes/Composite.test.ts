/**
 * Created by josh on 3/30/16.
 */
'use strict';

import {assert} from 'chai';

import {
	Event,
	ResultCodes
} from '../../lib';

import * as TestActions from './test/Actions';
import {BasicState} from './test/Actions';

let waitAi = TestActions.waitAi;

describe('Composite', function() {

	context('#resetNodeStorage', function() {

		it('should reset child state', function() {
			let event = new Event('channelType', 'channelId', 'type');
			let state: BasicState;
			state.overheated = true;

			return waitAi.handleEvent(state, event)
			.catch((err) => {
				console.error(err.stack);
			})
			.then((res) => {
				// assert state of child
				assert.equal(res, ResultCodes.RUNNING);
				assert.equal(state.batteryLevel, 1);
				assert.equal(state.cooldownLevel, 1);

				// reset state
				waitAi.resetNodeStorage(state);
			})
			.then(() => waitAi.handleEvent(state, event))
			.then((res) => {
				// assert state of child again
				assert.equal(res, ResultCodes.RUNNING);
				assert.equal(state.batteryLevel, 2);

				// Normally would be 0
				assert.equal(state.cooldownLevel, 1);
			});

		});
	});
});
