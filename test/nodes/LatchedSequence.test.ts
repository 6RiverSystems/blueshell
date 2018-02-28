/**
 * Created by josh on 1/15/16.
 */
import {assert} from 'chai';

import {resultCodes as rc} from '../../lib/utils/resultCodes';

import * as Behavior from '../../lib';

import {RobotState} from './test/RobotActions';

class StopMotors extends Behavior.Action<RobotState, string> {
	onEvent(state: RobotState, event: string) {
		state.commands.push('motorsStopped');

		return rc.SUCCESS;
	}
}

class StopLasers extends Behavior.Action<RobotState, string> {
	onEvent(state: RobotState, event: string) {
		const storage = this.getNodeStorage(state);

		storage.cooldown = storage.cooldown ? --storage.cooldown : state.laserCooldownTime;

		let result = rc.SUCCESS;

		console.log('Storage cooldown is ', storage.cooldown);

		if (storage.cooldown > 0) {
			result = rc.RUNNING;
		} else {
			state.commands.push('lasersCooled');
		}

		return result;
	}
}

class Shutdown extends Behavior.Action<RobotState, string> {
	onEvent(state: RobotState, event: string) {
		state.commands.push('powerOff');

		return rc.SUCCESS;
	}
}

const shutdownSequence = new Behavior.LatchedSequence('shutdownWithWaitAi',
	[
		new StopMotors(),
		new StopLasers(),
		new Shutdown(),
	]);

describe('LatchedSelector', function() {
	it('should run correctly', function() {
		// With a happy bot
		const botState = new RobotState();
		botState.laserCooldownTime = 0;

		const res = shutdownSequence.handleEvent(botState, 'lowBattery');

		assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
		assert.equal(botState.commands.length, 3, 'Need Three Commands');
		assert.equal(botState.commands[0], 'motorsStopped');
		assert.equal(botState.commands[1], 'lasersCooled');
		assert.equal(botState.commands[2], 'powerOff');
	});

	it('should loop correctly', function() {
		// With a happy bot
		const botState = new RobotState();
		botState.laserCooldownTime = 1;

		let res = shutdownSequence.handleEvent(botState, 'lowBattery 1');

		assert.equal(res, rc.RUNNING, 'Behavior Tree Running');
		assert.equal(botState.commands.length, 1);
		assert.equal(botState.commands[0], 'motorsStopped');

		res = shutdownSequence.handleEvent(botState, 'lowBattery 2');

		assert.equal(res, rc.SUCCESS, 'Behavior Tree Success');
		assert.equal(botState.commands.length, 3, 'Need Three Commands');
		assert.equal(botState.commands[0], 'motorsStopped');
		assert.equal(botState.commands[1], 'lasersCooled');
		assert.equal(botState.commands[2], 'powerOff');
	});
});
