/**
 * Created by josh on 1/10/16.
 */
import {assert} from 'chai';

import * as TestActions from './test/RobotActions';
import {rc} from '../../lib';
import * as Behavior from '../../lib';


const shutdownAi = new Behavior.LatchedSelector('shutdownAi',
	[
		new TestActions.Recharge(),
		new TestActions.EmergencyShutdown(),
	]);

const waitAi = TestActions.waitAi;

describe('LatchedSelector', function() {
	it('should return success', function() {
		// With a happy bot
		const botState = new TestActions.RobotState();

		const res = shutdownAi.handleEvent(botState, 'lowBattery');

		assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
		assert.equal(botState.commands.length, 1, 'Only one command');
		assert.equal(botState.commands[0], 'findDock', 'Searching for dock');
	});

	it('should return failure', function() {
		// With a happy bot
		const botState = new TestActions.RobotState();
		botState.overheated = true;

		let res = waitAi.handleEvent(botState, 'lowBattery 1');

		assert.equal(res, rc.RUNNING, 'Behavior Tree Running');
		assert.equal(botState.batteryLevel, 1, 'Ran recharge only once');

		res = waitAi.handleEvent(botState, 'lowBattery 2');

		assert.equal(res, rc.SUCCESS, 'Behavior Tree Success');
		assert.equal(botState.commands.length, 0, 'No commands, waiting for cooldown');

		// Ticking the battery level only twice proves we latched
		// on cooldown and didn't run recharge.
		assert.equal(botState.batteryLevel, 1, 'Ran recharge only once');

		res = waitAi.handleEvent(botState, 'lowBattery 3');

		assert.equal(res, rc.SUCCESS, 'Behavior Tree Success');
		assert.equal(botState.commands.length, 1, 'Only one command');
		assert.equal(botState.commands[0], 'findDock', 'Searching for dock');

		// Ticking the battery level only twice proves we latched
		// on cooldown and didn't run recharge.
		assert.equal(botState.batteryLevel, 2, 'Ran recharge twice');
	});
});
