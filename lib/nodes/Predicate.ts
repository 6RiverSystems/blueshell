import {BlueshellState, rc} from '../models';
import {Action} from '.';

export class Predicate<S extends BlueshellState, E> extends Action<S, E> {
	constructor(name: string, private readonly predicate: (state: S, event: E) => boolean) {
		super(name);
	}

	protected onEvent(state: S, event: E) {
		return this.predicate(state, event) ? rc.SUCCESS : rc.FAILURE;
	}
}
