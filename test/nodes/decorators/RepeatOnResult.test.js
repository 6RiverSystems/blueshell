/**
 * Created by josh on 1/21/16.
 */
'use strict';

const assert = require('chai').assert;

const rc = require('../../../lib/utils/resultCodes');
const Behavior = require('../../../lib');
const Action = Behavior.Action;
const RepeatOnResult = Behavior.decorators.RepeatOnResult;

class CountUntil extends Action {
	onEvent(state, event) {
		state.counter += 1;

		return {
			result: state.counter <= event ? rc.RUNNING : rc.SUCCESS,
			state,
		};
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

		const makeVerify = function(test) {
			return function(res) {
				assert.equal(res.state.counter, test.counter, `Counter: ${test.action.name} -> ${test.counter}`);
				assert.equal(res, rc.SUCCESS, `Result: ${test.action.name} -> ${test.counter}`);
			};
		};

		for (const test of tests) {
			// isolated per test
			const state = {
				counter: 0,
			};
			const p = test.action.handleEvent(state, test.event);

			p.then(makeVerify(test));
		}
	});
});
