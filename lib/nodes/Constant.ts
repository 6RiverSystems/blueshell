import {ResultCode, BlueshellState} from '../models';
import {Action} from './Base';

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
