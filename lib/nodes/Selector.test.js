/**
 * Created by josh on 1/10/16.
 */
'use strict';

var test = require('tape');

var Behavior = require('../index');

class Recharge extends Behavior.Action {

	constructor() {
		super('Recharge');
	}

	handleEvent(state, event) {

		let result = 'SUCCESS';

		if (state.overheated) {
			result = 'FAILURE';
		} else {
			state.commands.push('findDock');
		}

		return {
			result,
			state
		};
	}
}
;

class EmergencyShutdown extends Behavior.Action {

	constructor() {
		super('EmergencyShutdown');
	}

	handleEvent(state, event) {
		state.commands.push('powerOff');

		return {
			result: 'SUCCESS',
			state
		};
	}
}

let shutdownAi = new Behavior.Selector('shutdownAi',
	[
		new Recharge(),
		new EmergencyShutdown()
	]);

test('Selector Success Test', function(t) {

	// With a happy bot
	let bot = {
		overheated: false,
		commands: []
	};
	let res = shutdownAi.handleEvent(bot, 'lowBattery');

	t.equal(res.result, 'SUCCESS', 'Behavior Tree success');
	t.equal(res.state.commands.length, 1, 'Only one command');
	t.equal(res.state.commands[0], 'findDock', 'Searching for dock');

	t.end();
});

test('Selector Failure Test', function(t) {

	// With a happy bot
	let bot = {
		overheated: true,
		commands: []
	};
	let res = shutdownAi.handleEvent(bot, 'lowBattery');

	t.equal(res.result, 'SUCCESS', 'Behavior Tree success');
	t.equal(res.state.commands[0], 'powerOff', 'Searching for dock');


	t.end();

});
