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

		return Promise.resolve({
			result,
			state
		});
	}
}

class EmergencyShutdown extends Behavior.Action {

	handleEvent(state, event) {
		state.commands.push('powerOff');

		return Promise.resolve({
			result: 'SUCCESS',
			state
		});
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

	let p = shutdownAi.handleEvent(bot, 'lowBattery');

	p.then((res) => {
		t.equal(res.result, 'SUCCESS', 'Behavior Tree success');
		t.equal(res.state.commands.length, 1, 'Only one command');
		t.equal(res.state.commands[0], 'findDock', 'Searching for dock');

		t.end();
	});
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

		return Promise.resolve({
			result,
			state
		});
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

	let p = waitAi.handleEvent(bot, 'lowBattery 1');

	p.then((res) => {
		t.equal(res.result, 'RUNNING', 'Behavior Tree Running');

		return waitAi.handleEvent(bot, 'lowBattery 2');
	}).then((res) => {

		t.equal(res.result, 'SUCCESS', 'Behavior Tree Success');
		t.equal(res.state.commands.length, 0, 'Only one command');

		return waitAi.handleEvent(bot, 'lowBattery 3');
	}).then((res) => {
		t.equal(res.result, 'SUCCESS', 'Behavior Tree Success');
		t.equal(res.state.commands.length, 1, 'Only one command');
		t.equal(res.state.commands[0], 'findDock', 'Searching for dock');

		t.end();
	});

});
