/**
 * Created by josh on 1/15/16.
 */
'use strict';

let assert = require('chai').assert;

let rc = require('../../lib/utils/ResultCodes');
let Behavior = require('../../lib');

class StopMotors extends Behavior.Action {

	onEvent(state, event) {

		state.commands.push('motorsStopped');

		return rc.SUCCESS;
	}
}

class StopLasers extends Behavior.Action {

	onEvent(state, event) {
		let storage = this.getNodeStorage(state);

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

class Shutdown extends Behavior.Action {

	onEvent(state, event) {
		state.commands.push('powerOff');

		return rc.SUCCESS;
	}
}

let shutdownSequence = new Behavior.LatchedSequence('shutdownWithWaitAi',
	[
		new StopMotors(),
		new StopLasers(),
		new Shutdown()
	], true);

describe('LatchedSelector', function() {

	it('should run correctly', function() {

		// With a happy bot
		let botState = {
			laserCooldownTime: 0,
			commands: []
		};

		let p = shutdownSequence.handleEvent(botState, 'lowBattery');

		return p.then(res => {
			assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
			assert.equal(botState.commands.length, 3, 'Need Three Commands');
			assert.equal(botState.commands[0], 'motorsStopped');
			assert.equal(botState.commands[1], 'lasersCooled');
			assert.equal(botState.commands[2], 'powerOff');
		});
	});

	it('should loop correctly', function() {
		// With a happy bot
		let botState = {
			laserCooldownTime: 1,
			commands: []
		};

		let p = shutdownSequence.handleEvent(botState, 'lowBattery 1');

		return p.then(res => {
			assert.equal(res, rc.RUNNING, 'Behavior Tree Running');
			assert.equal(botState.commands.length, 1);
			assert.equal(botState.commands[0], 'motorsStopped');

			return shutdownSequence.handleEvent(botState, 'lowBattery 2');
		}).then(res => {

			assert.equal(res, rc.SUCCESS, 'Behavior Tree Success');
			assert.equal(botState.commands.length, 3, 'Need Three Commands');
			assert.equal(botState.commands[0], 'motorsStopped');
			assert.equal(botState.commands[1], 'lasersCooled');
			assert.equal(botState.commands[2], 'powerOff');
		});
	});
});
