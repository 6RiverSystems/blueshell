/**
 * Created by josh on 1/18/16.
 */
import {assert} from 'chai';

import {resultCodes as rc} from '../../../lib/utils/resultCodes';

import * as Behavior from '../../../lib';
import {BlueshellState} from '../../../lib/nodes/BlueshellState';

class RobotState implements BlueshellState {
	public batteryLevel?: number;
	public cooldownLevel?: number;
	public overheated?: boolean;
	public commands: string[] = [];
	public laserCooldownTime?: number;

	public errorReason?: Error;
	public __blueshell: any;

	constructor(debug: boolean = false) {
		this.overheated = false;
		this.commands = [];
		this.__blueshell = {
			debug,
		};
	}
}

class Recharge extends Behavior.Action<RobotState, string> {
	onEvent(state: RobotState, event: string): string {
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

class WaitForCooldown extends Behavior.Action<RobotState, string> {
	onEvent(state: RobotState, event: string): string {

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

class EmergencyShutdown extends Behavior.Action<RobotState, string> {
	onEvent(state: RobotState, event: string) {
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

export {
	RobotState,
	Recharge,
	WaitForCooldown,
	EmergencyShutdown,
	waitAi,
};
