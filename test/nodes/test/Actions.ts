/**
 * Created by josh on 1/18/16.
 */
'use strict';

import * as Blueshell from '../../../dist';
let rc = Blueshell.ResultCodes;

export class BasicState {
	commands: any[];
	__blueshell: any = {};
	batteryLevel: number;
	cooldownLevel: number;
	overheated: boolean;

	constructor(debug?: boolean) {
		this.__blueshell.debug = debug;
	}
}

export class Recharge extends Blueshell.Operation {

	onEvent(state: any, event: any): Promise<Blueshell.ResultCodes> {

		let result = rc.SUCCESS;

		state.batteryLevel = state.batteryLevel !== undefined ? ++state.batteryLevel : 1;

		if (state.overheated) {
			result = rc.FAILURE;
		} else {
			state.commands.push('findDock');
		}

		return Promise.resolve(result);
	}
}

export class WaitForCooldown extends Blueshell.Operation {

	onEvent(state: any, event: any): Promise<Blueshell.ResultCodes> {
		let storage = this.getNodeStorage(state);

		storage.cooldown = storage.cooldown ? --storage.cooldown : 1;

		let result = rc.SUCCESS;

		console.log('Storage cooldown is ', storage.cooldown);

		if (storage.cooldown) {
			state.cooldownLevel = storage.cooldown;
			result = rc.RUNNING;
		} else {
			state.overheated = false;
		}

		return Promise.resolve(result);
	}
}

export class EmergencyShutdown extends Blueshell.Operation {

	onEvent(state: any, event: any): Promise<Blueshell.ResultCodes> {
		state.commands.push('powerOff');

		return Promise.resolve(rc.SUCCESS);
	}
}

let waitAi = new Blueshell.LatchedSelector('shutdownWithWaitAi',
	[
		new Recharge(),
		new WaitForCooldown(),
		new EmergencyShutdown()
	]);

export {waitAi};
