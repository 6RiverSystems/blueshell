/**
 * Created by josh on 1/12/16.
 */
import {assert} from 'chai';

import {resultCodes as rc} from '../../../lib/utils/resultCodes';

import * as Behavior from '../../../lib';
import {DroneState} from '../test/DroneActions';

const Action = Behavior.Action;
const Not = Behavior.decorators.Not;

class EchoAction extends Action<DroneState, string> {
	onEvent(state: DroneState, event: string) {
		return event;
	}
}

describe('Not', function() {
	it('should negate the result code', function() {
		const echo = new EchoAction();
		const unEcho = new Not('unEcho', echo);

		const tests = [
			{action: echo, event: rc.SUCCESS, result: rc.SUCCESS},
			{action: echo, event: rc.FAILURE, result: rc.FAILURE},
			{action: echo, event: rc.RUNNING, result: rc.RUNNING},
			{action: unEcho, event: rc.SUCCESS, result: rc.FAILURE},
			{action: unEcho, event: rc.FAILURE, result: rc.SUCCESS},
			{action: unEcho, event: rc.RUNNING, result: rc.RUNNING},
		];

		const makeVerify = function(test: any, state: DroneState) {
			return function(res: string) {
				assert.equal(res, test.result, `${test.action.name} -> ${test.result}`);
			};
		};

		const ps = [];

		for (const test of tests) {
			const state = new DroneState();
			const p = test.action.handleEvent(state, test.event);

			ps.push(p.then(makeVerify(test, state)));
		}

		return Promise.all(ps);
	});
});
