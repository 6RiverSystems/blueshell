/**
 * Created by josh on 1/10/16.
 */
'use strict';

const assert = require('chai').assert;

const rc = require('../../lib/utils/resultCodes');
const Behavior = require('../../lib');

const TestActions = require('./test/Actions');

const shutdownAi = new Behavior.LatchedSelector('shutdownAi',
	[
		new TestActions.Recharge(),
		new TestActions.EmergencyShutdown(),
	]);

const waitAi = TestActions.waitAi;

describe('LatchedSelector', function() {
	it('should return success', function() {
		// With a happy bot
		const botState = {
			overheated: false,
			commands: [],
		};

		const p = shutdownAi.handleEvent(botState, 'lowBattery');

		return p.then((res) => {
			assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
			assert.equal(botState.commands.length, 1, 'Only one command');
			assert.equal(botState.commands[0], 'findDock', 'Searching for dock');
		});
	});

	it('should return failure', function() {
		// With a happy bot
		const botState = {
			overheated: true,
			commands: [],
		};

		const p = waitAi.handleEvent(botState, 'lowBattery 1');

		return p.then((res) => {
			assert.equal(res, rc.RUNNING, 'Behavior Tree Running');
			assert.equal(botState.batteryLevel, 1, 'Ran recharge only once');

			return waitAi.handleEvent(botState, 'lowBattery 2');
		}).then((res) => {
			assert.equal(res, rc.SUCCESS, 'Behavior Tree Success');
			assert.equal(botState.commands.length, 0, 'No commands, waiting for cooldown');

			// Ticking the battery level only twice proves we latched
			// on cooldown and didn't run recharge.
			assert.equal(botState.batteryLevel, 1, 'Ran recharge only once');

			return waitAi.handleEvent(botState, 'lowBattery 3');
		}).then((res) => {
			assert.equal(res, rc.SUCCESS, 'Behavior Tree Success');
			assert.equal(botState.commands.length, 1, 'Only one command');
			assert.equal(botState.commands[0], 'findDock', 'Searching for dock');

			// Ticking the battery level only twice proves we latched
			// on cooldown and didn't run recharge.
			assert.equal(botState.batteryLevel, 2, 'Ran recharge twice');
		});
	});
});
