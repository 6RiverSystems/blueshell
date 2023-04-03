import { Action } from './Base';
import { BlueshellState, rc } from '../models';

export class SideEffect<S extends BlueshellState, E> extends Action<S, E> {
	constructor(readonly name: string, private sideEffect: (state: S, event: E) => void) {
		super(name);
	}

	protected onEvent(state: S, event: E) {
		this.sideEffect(state, event);
		return rc.SUCCESS;
	}
}
