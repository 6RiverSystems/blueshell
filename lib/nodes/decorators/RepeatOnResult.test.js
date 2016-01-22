/**
 * Created by josh on 1/21/16.
 */
'use strict';

let test = require('tape');

let Action = require('lib/nodes/Base');
let RepeatOnResult = require('./RepeatOnResult');

class CountUntil extends Action {

	onEvent(state, event) {

		state.counter += 1;

		return {
			result: state.counter <= event ? 'RUNNING' : 'SUCCESS',
			state
		};
	}
}

test('Base Path Test', function(t) {

	t.plan(4);

	var countUntil = new CountUntil();
	var unEcho = new RepeatOnResult('RUNNING', countUntil);

	let tests = [
		{action: unEcho, event: 0, counter: 1},
		{action: unEcho, event: 2, counter: 3}
	];

	let makeVerify = function(test) {
		return function(res) {
			t.equal(res.state.counter, test.counter, `Counter: ${test.action.name} -> ${test.counter}`);
			t.equal(res.result, 'SUCCESS', `Result: ${test.action.name} -> ${test.counter}`);
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
