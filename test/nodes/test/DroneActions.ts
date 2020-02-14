import {BlueshellState} from '../../../lib';

export class DroneState implements BlueshellState {
	public flares: number = 0;
	public commands: string[] = [];

	public errorReason?: Error;
	public __blueshell: any;

	constructor(debug: boolean = false) {
		this.flares = 0;
		this.__blueshell = {
			debug,
		};
	}
}
