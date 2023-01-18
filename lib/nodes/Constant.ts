import {Action} from './Base';
import {ResultCode, BlueshellState} from '../models';

export class Constant<S extends BlueshellState, E> extends Action<S, E> {
	constructor(
		private readonly result: ResultCode,
		name: string = result,
	) {
		super(name);
	}

	protected onEvent() {
		return this.result;
	}
}
