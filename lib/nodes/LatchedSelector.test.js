/**
 * Created by josh on 1/10/16.
 */
'use strict';

var test = require('tape-catch');

var Behavior = require('../index');

var TestActions = require('./test/Actions');

let shutdownAi = new Behavior.LatchedSelector('shutdownAi',
	[
		new TestActions.Recharge(),
		new TestActions.EmergencyShutdown()
	]);

test('LatchedSelector Success Test', function(t) {

	// With a happy bot
	let bot = {
		overheated: false,
		commands: []
	};

	let p = shutdownAi.handleEvent(bot, 'lowBattery');

	p.then(res => {
		t.equal(res.result, 'SUCCESS', 'Behavior Tree success');
		t.equal(res.state.commands.length, 1, 'Only one command');
		t.equal(res.state.commands[0], 'findDock', 'Searching for dock');

		t.end();
	});
});

let waitAi = new Behavior.LatchedSelector('shutdownWithWaitAi',
	[
		new TestActions.Recharge(),
		new TestActions.WaitForCooldown(),
		new TestActions.EmergencyShutdown()
	]);

test('LatchedSelector Failure Test', function(t) {

	// With a happy bot
	let bot = {
		overheated: true,
		commands: []
	};

	let p = waitAi.handleEvent(bot, 'lowBattery 1');

	p.then(res => {
		t.equal(res.result, 'RUNNING', 'Behavior Tree Running');
		t.equal(res.state.batteryLevel, 1, 'Ran recharge only once');

		return waitAi.handleEvent(bot, 'lowBattery 2');
	}).then(res => {
		t.equal(res.result, 'SUCCESS', 'Behavior Tree Success');
		t.equal(res.state.commands.length, 0, 'No commands, waiting for cooldown');

		// Ticking the battery level only twice proves we latched
		// on cooldown and didn't run recharge.
		t.equal(res.state.batteryLevel, 1, 'Ran recharge only once');

		return waitAi.handleEvent(bot, 'lowBattery 3');
	}).then(res => {
		t.equal(res.result, 'SUCCESS', 'Behavior Tree Success');
		t.equal(res.state.commands.length, 1, 'Only one command');
		t.equal(res.state.commands[0], 'findDock', 'Searching for dock');

		// Ticking the battery level only twice proves we latched
		// on cooldown and didn't run recharge.
		t.equal(res.state.batteryLevel, 2, 'Ran recharge twice');

		t.end();
	});

});
