/**
 * Created by josh on 1/12/16.
 */
'use strict';

let assert = require('chai').assert;

let Behavior = require('../../../lib');
var Action = Behavior.Action;
var Not = Behavior.decorators.Not;

class EchoAction extends Action {

	onEvent(state, event) {
		return {
			result: event,
			state
		};
	}
}

describe('Not', function() {

	it('should negate the result code', function() {

		var echo = new EchoAction();
		var unEcho = new Not('unEcho', echo);

		let tests = [
			{action: echo, event: 'SUCCESS', result: 'SUCCESS'},
			{action: echo, event: 'FAILURE', result: 'FAILURE'},
			{action: echo, event: 'RUNNING', result: 'RUNNING'},
			{action: unEcho, event: 'SUCCESS', result: 'FAILURE'},
			{action: unEcho, event: 'FAILURE', result: 'SUCCESS'},
			{action: unEcho, event: 'RUNNING', result: 'RUNNING'}
		];

		let makeVerify = function(test) {
			return function(res) {
				assert.equal(res.result, test.result, `${test.action.name} -> ${test.result}`);
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
