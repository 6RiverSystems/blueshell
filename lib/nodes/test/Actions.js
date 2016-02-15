/**
 * Created by josh on 1/18/16.
 */
'use strict';

var Behavior = require('lib/index');

class Recharge extends Behavior.Action {

	onEvent(state, event) {

		let result = 'SUCCESS';

		state.batteryLevel = state.batteryLevel !== undefined ? ++state.batteryLevel : 1;

		if (state.overheated) {
			result = 'FAILURE';
		} else {
			state.commands.push('findDock');
		}

		return {
			result,
			state
		};
	}
}

class WaitForCooldown extends Behavior.Action {

	onEvent(state, event) {
		let storage = this.getStorage(state);

		storage.cooldown = storage.cooldown ? --storage.cooldown : 1;

		let result = 'SUCCESS';

		console.log('Storage cooldown is ', storage.cooldown);

		if (storage.cooldown) {
			result = 'RUNNING';
		} else {
			state.overheated = false;
		}

		return {
			result,
			state
		};
	}
}

class EmergencyShutdown extends Behavior.Action {

	onEvent(state, event) {
		state.commands.push('powerOff');

		return {
			result: 'SUCCESS',
			state
		};
	}
}


module.exports = {
	Recharge,
	WaitForCooldown,
	EmergencyShutdown
};
