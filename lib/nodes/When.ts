import {Composite} from './Composite';
import {BlueshellState} from './BlueshellState';
import {resultCodes as rc, ResultCode} from '../utils/resultCodes';
import {Base} from './Base';

export interface Conditional<S, E> {
	(state: S, event: E): boolean;
}

/**
 * When Conditional Composite Node.
 *
 * If `conditional(state: S, event: E)` returns true,
 * control is passed to the consequent node.
 */
export class When<S extends BlueshellState, E> extends Composite<S, E> {
	constructor(name: string,
	            private readonly conditional: Conditional<S, E>,
							private readonly consequent: Base<S, E>,
							private readonly result: ResultCode = rc.SUCCESS,
							latched: boolean = false) {
		super(name, [consequent], latched);
	}

	/**
	 * If `conditional` resolves to `true`, then the `consequent` node handles the event.
	 * Otherwise, this node resolves to `SUCCESS` or the provided result
	 * @override
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 * @param i The child index, which is always 0
	 */
	handleChild(state: S, event: E) {
		if (this.conditional(state, event)) {
			return this.consequent.handleEvent(state, event);
		} else {
			return this.result;
		}
	}

	get symbol() {
		return '?!';
	}
}
