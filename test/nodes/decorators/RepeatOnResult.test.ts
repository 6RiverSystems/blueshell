/**
 * Created by josh on 1/21/16.
 */
import {assert} from 'chai';

import {resultCodes as rc, ResultCode} from '../../../lib/utils/resultCodes';

import * as Behavior from '../../../lib';
import {DroneState} from '../test/DroneActions';

const Action = Behavior.Action;
const RepeatOnResult = Behavior.decorators.RepeatOnResult;

class CountUntil extends Action<DroneState, number> {
	onEvent(state: DroneState, event: number): ResultCode {
		state.flares += 1;

		return state.flares <= event ? rc.RUNNING : rc.SUCCESS;
	}
}

describe('RepeatOnResult', function() {
	it('repeat when child returns running', function() {
		const countUntil = new CountUntil();
		const unEcho = new RepeatOnResult(rc.RUNNING, countUntil);

		const tests = [
			{action: unEcho, event: 0, counter: 1},
			{action: unEcho, event: 2, counter: 3},
		];

		const makeVerify = function(test: any, state: DroneState) {
			return function(res: string) {
				assert.equal(state.flares, test.counter, `Flare Count: ${test.action.name} -> ${test.counter}`);
				assert.equal(res, rc.SUCCESS, `Result: ${test.action.name} -> ${test.counter}`);
			};
		};

		for (const test of tests) {
			// isolated per test
			const state = new DroneState();

			test.action.handleEvent(state, test.event);

			makeVerify(test, state);
		}
	});
});
