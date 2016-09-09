/**
 * Created by josh on 1/15/16.
 */
'use strict';

import {assert} from 'chai';
import * as Blueshell from '../../dist';

type ResultCodes = Blueshell.ResultCodes;

class StopMotors extends Blueshell.Operation {

	onEvent(state: any, event: any): Promise<ResultCodes> {

		state.commands.push('motorsStopped');

		return Promise.resolve(Blueshell.ResultCodes.SUCCESS);
	}
}

class StopLasers extends Blueshell.Operation {

	onEvent(state: any, event: any): Promise<ResultCodes> {
		let storage = this.getNodeStorage(state);

		storage.cooldown = storage.cooldown ? --storage.cooldown : state.laserCooldownTime;

		let result = Blueshell.ResultCodes.SUCCESS;

		console.log('Storage cooldown is ', storage.cooldown);

		if (storage.cooldown > 0) {
			result = Blueshell.ResultCodes.RUNNING;
		} else {
			state.commands.push('lasersCooled');
		}

		return Promise.resolve(result);
	}
}

class Shutdown extends Blueshell.Operation {

	onEvent(state: any, event: any): Promise<ResultCodes> {
		state.commands.push('powerOff');

		return Promise.resolve(Blueshell.ResultCodes.SUCCESS);
	}
}

let shutdownSequence = new Blueshell.LatchedSequence('shutdownWithWaitAi',
	[
		new StopMotors(),
		new StopLasers(),
		new Shutdown()
	]);

describe('LatchedSelector', function() {

	it('should run correctly', function() {

		// With a happy bot
		let botState = {
			laserCooldownTime: 0,
			commands: []
		};

		let p = shutdownSequence.handleEvent(botState, 'lowBattery');

		return p.then(res => {
			assert.equal(res, Blueshell.ResultCodes.SUCCESS, 'Behavior Tree success');
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
			assert.equal(res, Blueshell.ResultCodes.RUNNING, 'Behavior Tree Running');
			assert.equal(botState.commands.length, 1);
			assert.equal(botState.commands[0], 'motorsStopped');

			return shutdownSequence.handleEvent(botState, 'lowBattery 2');
		}).then(res => {

			assert.equal(res, Blueshell.ResultCodes.SUCCESS, 'Behavior Tree Success');
			assert.equal(botState.commands.length, 3, 'Need Three Commands');
			assert.equal(botState.commands[0], 'motorsStopped');
			assert.equal(botState.commands[1], 'lasersCooled');
			assert.equal(botState.commands[2], 'powerOff');
		});
	});
});
