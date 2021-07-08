/**
 * Created by josh on 1/18/16.
 */
import {rc} from '../../../lib';
import * as Behavior from '../../../lib';

class RobotState implements Behavior.BlueshellState {
	public batteryLevel?: number;
	public cooldownLevel?: number;
	public overheated?: boolean;
	public commands: string[] = [];
	public laserCooldownTime?: number;

	public errorReason?: Error;
	public __blueshell: any;
	public nodePath: string = '';

	constructor(debug: boolean = false) {
		this.overheated = false;
		this.commands = [];
		this.__blueshell = {
			debug,
		};
	}
}

class Recharge extends Behavior.Action<RobotState, string> {
	constructor() {
		super('Recharge');
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onEvent(state: RobotState, event: string): Behavior.ResultCode {
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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onEvent(state: RobotState, event: string): Behavior.ResultCode {
		const storage: any = this.getNodeStorage(state);

		storage.cooldown = storage.cooldown ? --storage.cooldown : 1;

		let result = rc.SUCCESS;

		// console.log('Storage cooldown is ', storage.cooldown);

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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
