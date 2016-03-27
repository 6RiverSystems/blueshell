/**
 * Created by josh on 1/15/16.
 */
'use strict';

let assert = require('chai').assert;

let Behavior = require('../../lib');

class StopMotors extends Behavior.Action {

	onEvent(state, event) {

		state.commands.push('motorsStopped');

		return {
			result: 'SUCCESS',
			state
		};
	}
}

class StopLasers extends Behavior.Action {

	onEvent(state, event) {
		let storage = this.getNodeStorage(state);

		storage.cooldown = storage.cooldown ? --storage.cooldown : state.laserCooldownTime;

		let result = 'SUCCESS';

		console.log('Storage cooldown is ', storage.cooldown);

		if (storage.cooldown > 0) {
			result = 'RUNNING';
		} else {
			state.commands.push('lasersCooled');
		}

		return {
			result,
			state
		};
	}
}

class Shutdown extends Behavior.Action {

	onEvent(state, event) {
		state.commands.push('powerOff');

		return {
			result: 'SUCCESS',
			state
		};
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
		let bot = {
			laserCooldownTime: 0,
			commands: []
		};

		let p = shutdownSequence.handleEvent(bot, 'lowBattery');

		return p.then(res => {
			assert.equal(res.result, 'SUCCESS', 'Behavior Tree success');
			assert.equal(res.state.commands.length, 3, 'Need Three Commands');
			assert.equal(res.state.commands[0], 'motorsStopped');
			assert.equal(res.state.commands[1], 'lasersCooled');
			assert.equal(res.state.commands[2], 'powerOff');
		});
	});

	it('should loop correctly', function() {
		// With a happy bot
		let bot = {
			laserCooldownTime: 1,
			commands: []
		};

		let p = shutdownSequence.handleEvent(bot, 'lowBattery 1');

		return p.then(res => {
			assert.equal(res.result, 'RUNNING', 'Behavior Tree Running');
			assert.equal(res.state.commands.length, 1);
			assert.equal(res.state.commands[0], 'motorsStopped');

			return shutdownSequence.handleEvent(bot, 'lowBattery 2');
		}).then(res => {

			assert.equal(res.result, 'SUCCESS', 'Behavior Tree Success');
			assert.equal(res.state.commands.length, 3, 'Need Three Commands');
			assert.equal(res.state.commands[0], 'motorsStopped');
			assert.equal(res.state.commands[1], 'lasersCooled');
			assert.equal(res.state.commands[2], 'powerOff');
		});
	});
});
