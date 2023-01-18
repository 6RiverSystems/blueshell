import {BlueshellState} from '../../../lib';

export class DroneState implements BlueshellState {
	public flares = 0;
	public commands: string[] = [];

	public errorReason?: Error;
	public __blueshell: any;

	constructor(debug = false) {
		this.flares = 0;
		this.__blueshell = {
			debug,
		};
	}
}
