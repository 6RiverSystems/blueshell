/**
 * Created by josh on 1/18/16.
 */
'use strict';

const rc = require('../../../lib/utils/resultCodes');
const Behavior = require('../../../lib');

function initialState(debug) {
	return {
		commands: [],
		__blueshell: {
			debug,
		},
	};
}

class Recharge extends Behavior.Action {
	onEvent(state, event) {
		let result = rc.SUCCESS;

		state.batteryLevel = state.batteryLevel !== undefined ? ++state.batteryLevel : 1;

		if (state.overheated) {
			result = rc.FAILURE;
		} else {
			state.commands.push('findDock');
		}

		return result;
	}
}

class WaitForCooldown extends Behavior.Action {
	onEvent(state, event) {
		const storage = this.getNodeStorage(state);

		storage.cooldown = storage.cooldown ? --storage.cooldown : 1;

		let result = rc.SUCCESS;

		console.log('Storage cooldown is ', storage.cooldown);

		if (storage.cooldown) {
			state.cooldownLevel = storage.cooldown;
			result = rc.RUNNING;
		} else {
			state.overheated = false;
		}

		return result;
	}
}

class EmergencyShutdown extends Behavior.Action {
	onEvent(state, event) {
		state.commands.push('powerOff');

		return rc.SUCCESS;
	}
}

const waitAi = new Behavior.LatchedSelector('shutdownWithWaitAi',
	[
		new Recharge(),
		new WaitForCooldown(),
		new EmergencyShutdown(),
	]);

module.exports = {
	Recharge,
	WaitForCooldown,
	EmergencyShutdown,
	initialState,
	waitAi,
};
