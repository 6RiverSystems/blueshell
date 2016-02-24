/**
 * Created by josh on 1/18/16.
 */
'use strict';

let assert = require('chai').assert;

let Behavior = require('../../lib');
var TestActions = require('./test/Actions');

let waitAi = new Behavior.Selector('shutdownWithWaitAi',
	[
		new TestActions.Recharge(),
		new TestActions.WaitForCooldown(),
		new TestActions.EmergencyShutdown()
	]);

describe('Selector', function() {
	it('should return success', function() {

		// With a happy bot
		let bot = {
			overheated: false,
			commands: []
		};

		let p = waitAi.handleEvent(bot, 'lowBattery');

		return p.then(res => {
			assert.equal(res.result, 'SUCCESS', 'Behavior Tree success');
			assert.equal(res.state.commands.length, 1, 'Only one command');
			assert.equal(res.state.commands[0], 'findDock', 'Searching for dock');
		});
	});

	it('should return failure', function() {
		// With a overheated bot
		let bot = {
			overheated: true,
			commands: []
		};

		let p = waitAi.handleEvent(bot, 'lowBattery 1');

		return p.then(res => {
			assert.equal(res.result, 'RUNNING', 'Behavior Tree Running');
			assert.equal(res.state.batteryLevel, 1, 'Ran recharge once');

			return waitAi.handleEvent(bot, 'lowBattery 2');
		}).then(res => {

			assert.equal(res.result, 'SUCCESS', 'Behavior Tree Success');
			assert.equal(res.state.commands.length, 0, 'No commands, waiting for cooldown');
			assert.equal(res.state.batteryLevel, 2, 'Ran recharge again');

			return waitAi.handleEvent(bot, 'lowBattery 3');
		}).then(res => {
			assert.equal(res.result, 'SUCCESS', 'Behavior Tree Success');
			assert.equal(res.state.commands.length, 1, 'Only one command');
			assert.equal(res.state.commands[0], 'findDock', 'Searching for dock');

			// Ticking battery level on each call proves we are NOT latching
			assert.equal(res.state.batteryLevel, 3, 'Ran recharge again');
		});
	});
});
