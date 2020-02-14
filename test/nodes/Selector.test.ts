/**
 * Created by josh on 1/18/16.
 */
import {assert} from 'chai';

import {rc} from '../../lib';
import * as Behavior from '../../lib';

import * as TestActions from './test/RobotActions';
import {RobotState} from './test/RobotActions';

const waitAi = new Behavior.Selector('shutdownWithWaitAi',
	[
		new TestActions.Recharge(),
		new TestActions.WaitForCooldown(),
		new TestActions.EmergencyShutdown(),
	]);

describe('Selector', function() {
	it('should return success', function() {
		// With a happy bot
		const botState = new RobotState();

		const res = waitAi.handleEvent(botState, 'lowBattery');

		assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
		assert.equal(botState.commands.length, 1, 'Only one command');
		assert.equal(botState.commands[0], 'findDock', 'Searching for dock');
	});

	it('should return failure', function() {
		// With a overheated bot
		const botState = new RobotState();
		botState.overheated = true;

		let res = waitAi.handleEvent(botState, 'lowBattery 1');

		assert.equal(res, rc.RUNNING, 'Behavior Tree Running');
		assert.equal(botState.batteryLevel, 1, 'Ran recharge once');

		res = waitAi.handleEvent(botState, 'lowBattery 2');

		assert.equal(res, rc.SUCCESS, 'Behavior Tree Success');
		assert.equal(botState.commands.length, 0, 'No commands, waiting for cooldown');
		assert.equal(botState.batteryLevel, 2, 'Ran recharge again');

		res = waitAi.handleEvent(botState, 'lowBattery 3');

		assert.equal(res, rc.SUCCESS, 'Behavior Tree Success');
		assert.equal(botState.commands.length, 1, 'Only one command');
		assert.equal(botState.commands[0], 'findDock', 'Searching for dock');

		// Ticking battery level on each call proves we are NOT latching
		assert.equal(botState.batteryLevel, 3, 'Ran recharge again');
	});
});
