'use strict';

import {
	ResultCodes,
	Operation,
	LatchedSelector
} from '../../../lib';

export class BasicState {
	commands: string[] = [];
	__blueshell: any = {};
	batteryLevel: number;
	cooldownLevel: number;
	overheated: boolean;
	laserCooldownTime: number;
	flares: number;
	success: boolean;
	errorReason: string;

	constructor(debug?: boolean) {
		(<any>this).__debug = debug;
	}
}

export class Recharge extends Operation<BasicState, any> {

	onEvent(state: BasicState, event: Event): Promise<ResultCodes> {

		let result = ResultCodes.SUCCESS;

		state.batteryLevel = state.batteryLevel !== undefined ? ++state.batteryLevel : 1;

		if (state.overheated) {
			result = ResultCodes.FAILURE;
		} else {
			state.commands.push('findDock');
		}

		return Promise.resolve(result);
	}
}

export class WaitForCooldown extends Operation<BasicState, any> {

	onEvent(state: BasicState, event: Event): Promise<ResultCodes> {
		let storage = this.getNodeStorage(state);

		storage.cooldown = storage.cooldown ? --storage.cooldown : 1;

		let result = ResultCodes.SUCCESS;

		console.log('Storage cooldown is ', storage.cooldown);

		if (storage.cooldown) {
			state.cooldownLevel = storage.cooldown;
			result = ResultCodes.RUNNING;
		} else {
			state.overheated = false;
		}

		return Promise.resolve(result);
	}
}

export class EmergencyShutdown extends Operation<BasicState, any> {

	onEvent(state: BasicState, event: Event): Promise<ResultCodes> {
		state.commands.push('powerOff');

		return Promise.resolve(ResultCodes.SUCCESS);
	}
}

let waitAi = new LatchedSelector('shutdownWithWaitAi',
	[
		new Recharge(),
		new WaitForCooldown(),
		new EmergencyShutdown()
	]);

export {waitAi};
