/**
 * Created by josh on 3/30/16.
 */

import {assert} from 'chai';
import * as sinon from 'sinon';

import {rc} from '../../lib';
import {RobotState, waitAi} from './test/RobotActions';
import {LatchedSelector, Constant} from '../../dist';

describe('Composite', function() {
	context('#resetNodeStorage', function() {
		it('should reset child state', function() {
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

		it('should call logging method', function() {
			const state = new RobotState(false);
			state.__blueshell.loggingCallback = sinon.stub();

			const constantNode = new Constant('RUNNING', 'test success');
			const selector = new LatchedSelector('testLatchedSelector', [
				constantNode,
			]);
			let res = selector.handleEvent(state, 'test event');
			assert.equal(res, rc.RUNNING);

			(<any>constantNode).result = 'SUCCESS';

			res = selector.handleEvent(state, 'test event 2');
			assert.equal(res, rc.SUCCESS);
			assert(state.__blueshell.loggingCallback.calledOnce, 'Logging callback not called');
		});
	});
});
