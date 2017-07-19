/**
 * Created by josh on 1/21/16.
 */
'use strict';

import {assert} from 'chai';
import * as Blueshell from '../../../dist';

let rc = Blueshell.ResultCodes;

let RepeatOnResult = Blueshell.decorators.RepeatOnResult;

class CountUntil extends Blueshell.Operation {

	onEvent(state: any, event: any): Promise<Blueshell.ResultCodes> {

		state.counter += 1;

		return Promise.resolve(state.counter <= event ? rc.RUNNING : rc.SUCCESS);
	}
}

describe('RepeatOnResult', function() {
	it('repeat when child returns running', function() {

		let countUntil = new CountUntil();
		let unEcho = new RepeatOnResult(rc.RUNNING, countUntil);

		let tests = [
			{action: unEcho, event: 0, counter: 1},
			{action: unEcho, event: 2, counter: 3}
		];

		let makeVerify = function(test) {
			return function(res) {
				assert.equal(res.state.counter, test.counter, `Counter: ${test.action.name} -> ${test.counter}`);
				assert.equal(res, rc.SUCCESS, `Result: ${test.action.name} -> ${test.counter}`);
			};
		};

		for (let test of tests) {
			// isolated per test
			let state = {
				counter: 0
			};
			let p = test.action.handleEvent(state, test.event);

			p.then(makeVerify(test));
		}

	});
});