/**
 * Created by josh on 1/12/16.
 */
'use strict';

const assert = require('chai').assert;

const rc = require('../../../lib/utils/resultCodes');
const Behavior = require('../../../lib');
const Action = Behavior.Action;
const Not = Behavior.decorators.Not;

class EchoAction extends Action {
	onEvent(state, event) {
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

		const makeVerify = function(test) {
			return function(res) {
				assert.equal(res, test.result, `${test.action.name} -> ${test.result}`);
			};
		};

		const ps = [];

		for (const test of tests) {
			const p = test.action.handleEvent({}, test.event);

			ps.push(p.then(makeVerify(test)));
		}

		return Promise.all(ps);
	});
});
