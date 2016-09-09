/**
 * Created by josh on 1/12/16.
 */
'use strict';

import {assert} from 'chai';
import * as Blueshell from '../../../dist';

let rc = Blueshell.ResultCodes;

let Not = Blueshell.decorators.Not;

class EchoAction extends Blueshell.Operation {

	onEvent(state: any, event: any): Promise<Blueshell.ResultCodes> {
		return event;
	}
}

describe('Not', function() {

	it('should negate the result code', function() {

		let echo = new EchoAction();
		let unEcho = new Not('unEcho', echo);

		let tests = [
			{action: echo, event: rc.SUCCESS, result: rc.SUCCESS},
			{action: echo, event: rc.FAILURE, result: rc.FAILURE},
			{action: echo, event: rc.RUNNING, result: rc.RUNNING},
			{action: unEcho, event: rc.SUCCESS, result: rc.FAILURE},
			{action: unEcho, event: rc.FAILURE, result: rc.SUCCESS},
			{action: unEcho, event: rc.RUNNING, result: rc.RUNNING}
		];

		let makeVerify = function(test) {
			return function(res) {
				assert.equal(res, test.result, `${test.action.name} -> ${test.result}`);
			};
		};

		let ps = [];

		for (let test of tests) {
			let p = test.action.handleEvent({}, test.event);

			ps.push(p.then(makeVerify(test)));
		}

		return Promise.all(ps);

	});
});
