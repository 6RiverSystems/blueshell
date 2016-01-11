/**
 * Created by josh on 1/10/16.
 */
'use strict';

var test = require('tape');

var Behavior = require('../index');

class Recharge extends Behavior.Action {

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

class EmergencyShutdown extends Behavior.Action {

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


class WaitForCooldown extends Behavior.Action {

	handleEvent(state, event) {
		let storage = this.getStorage(state);

		storage.cooldown = storage.cooldown ? --storage.cooldown : 1;

		let result = 'SUCCESS';

		console.log('Storage cooldown is ', storage.cooldown);

		if (storage.cooldown) {
			result = 'RUNNING';
		} else {
			state.overheated = false;
		}

		return {
			result,
			state
		};
	}
}

let waitAi = new Behavior.Selector('shutdownWithWaitAi',
	[
		new Recharge(),
		new WaitForCooldown(),
		new EmergencyShutdown()
	]);

test('Selector Failure Test', function(t) {

	// With a happy bot
	let bot = {
		overheated: true,
		commands: []
	};

	let res = waitAi.handleEvent(bot, 'lowBattery 1');

	t.equal(res.result, 'RUNNING', 'Behavior Tree Running');

	let res2 = waitAi.handleEvent(bot, 'lowBattery 2');

	t.equal(res2.result, 'SUCCESS', 'Behavior Tree Success');
	t.equal(res2.state.commands.length, 0, 'Only one command');

	let res3 = waitAi.handleEvent(bot, 'lowBattery 3');

	t.equal(res3.result, 'SUCCESS', 'Behavior Tree Success');
	t.equal(res3.state.commands.length, 1, 'Only one command');
	t.equal(res3.state.commands[0], 'findDock', 'Searching for dock');

	t.end();

});
