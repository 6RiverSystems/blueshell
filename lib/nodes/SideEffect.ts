import {BlueshellState} from './BlueshellState';
import {resultCodes as rc} from '../utils/resultCodes';
import {Base} from './Base';

export class SideEffect<S extends BlueshellState, E> extends Base<S, E> {
	constructor(public readonly name: string, private sideEffect: (state: S, event: E) => void) {
		super(name);
	}

	onEvent(state: S, event: E) {
		this.sideEffect(state, event);
		return rc.SUCCESS;
	}
}
