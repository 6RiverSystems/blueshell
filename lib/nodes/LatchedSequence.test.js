/**
 * Created by josh on 1/15/16.
 */
'use strict';

/**
 * Created by josh on 1/10/16.
 */
'use strict';

var test = require('tape-catch');

var Behavior = require('../index');

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
		let storage = this.getStorage(state);

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
	]);

test('LatchedSequence Basic Test', function(t) {

	// With a happy bot
	let bot = {
		laserCooldownTime: 0,
		commands: []
	};

	let p = shutdownSequence.handleEvent(bot, 'lowBattery');

	p.then(res => {
		t.equal(res.result, 'SUCCESS', 'Behavior Tree success');
		t.equal(res.state.commands.length, 3, 'Need Three Commands');
		t.equal(res.state.commands[0], 'motorsStopped');
		t.equal(res.state.commands[1], 'lasersCooled');
		t.equal(res.state.commands[2], 'powerOff');

		t.end();
	});
});



test('LatchedSequence Loop Test', function(t) {

	// With a happy bot
	let bot = {
		laserCooldownTime: 1,
		commands: []
	};

	let p = shutdownSequence.handleEvent(bot, 'lowBattery 1');

	p.then(res => {
		t.equal(res.result, 'RUNNING', 'Behavior Tree Running');
		t.equal(res.state.commands.length, 1);
		t.equal(res.state.commands[0], 'motorsStopped');

		return shutdownSequence.handleEvent(bot, 'lowBattery 2');
	}).then(res => {

		t.equal(res.result, 'SUCCESS', 'Behavior Tree Success');
		t.equal(res.state.commands.length, 3, 'Need Three Commands');
		t.equal(res.state.commands[0], 'motorsStopped');
		t.equal(res.state.commands[1], 'lasersCooled');
		t.equal(res.state.commands[2], 'powerOff');

		t.end();
	});

});
