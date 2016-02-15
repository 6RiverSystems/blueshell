/**
 * Created by josh on 1/12/16.
 */
'use strict';

var test = require('tape');

var Action = require('../Base');
var Not = require('./Not');

class EchoAction extends Action {

	onEvent(state, event) {
		return {
			result: event,
			state
		};
	}
}

test('Base Path Test', function(t) {

	t.plan(6);

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
			t.equal(res.result, test.result, `${test.action.name} -> ${test.result}`);
		};
	};

	for (let test of tests) {
		let p = test.action.handleEvent({}, test.event);

		p.then(makeVerify(test));
	}

});
