'use strict';

import {assert} from 'chai';

import {
	Event,
	Operation,
	ResultCodes,
	Not
} from '../../../lib';

class EchoAction<State> extends Operation<State> {

	onEvent(state: State, event: Event): Promise<ResultCodes> {
		return Promise.resolve(<any>event);
	}
}

describe('Not', function() {

	it('should negate the result code', function() {

		let echo = new EchoAction();
		let unEcho = new Not('unEcho', echo);

		let tests: any = [
			{action: echo, event: ResultCodes.SUCCESS, result: ResultCodes.SUCCESS},
			{action: echo, event: ResultCodes.FAILURE, result: ResultCodes.FAILURE},
			{action: echo, event: ResultCodes.RUNNING, result: ResultCodes.RUNNING},
			{action: unEcho, event: ResultCodes.SUCCESS, result: ResultCodes.FAILURE},
			{action: unEcho, event: ResultCodes.FAILURE, result: ResultCodes.SUCCESS},
			{action: unEcho, event: ResultCodes.RUNNING, result: ResultCodes.RUNNING}
		];

		let makeVerify = function(test: any) {
			return function(res: any) {
				assert.equal(res, test.result, `${test.action.name} -> ${test.result}`);
			};
		};

		const event = new Event('channelType', 'channelId', 'testEvent');

		let ps: any = [];

		for (let test of tests) {
			let p = test.action.handleEvent(event, (<any>test).event);

			ps.push(p.then(makeVerify(test)));
		}

		return Promise.all(ps);

	});
});
