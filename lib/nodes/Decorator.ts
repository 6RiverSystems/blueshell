import {BlueshellState} from './BlueshellState';
import {Base} from './Base';
import {Composite} from './Composite';
import {resultCodes as rc, ResultCode} from '../utils/resultCodes';

/**
 * Base Class for all Decorator Nodes. Can only have one child.
 * Decorators intercept and can modify the event sent to or the result from the child.
 * @author Joshua Chaitin-Pollak
 */
export class Decorator<S extends BlueshellState, E> extends Composite<S, E> {
	/**
	 * Can only pass in one child.
	 * @constructor
	 * @param name
	 * @param child
	 */
	constructor(name: string, child: Base<S, E>, latched = true) {
		super(name, [child], latched);
	}

	get child() {
		return this.children[0];
	}

	/**
	 * Passthrough to child Node.
	 * @param state
	 * @param event
	 */
	handleChild(state: S, event: E): ResultCode {
		// Passthrough
		event = this.decorateEvent(event);
		const res = this.decorateResult(
			this.decorateCall(
				(state, event) => this.child.handleEvent(state, event),
				state,
				event
			),
			state,
			event
		);
		if (this.latched && res === rc.RUNNING) {
			const storage = this.getNodeStorage(state);
			storage.running = 0;
		}
		return res;
	}

	decorateEvent(event: E): E {
		return event;
	}

	decorateCall(handleEvent: (state: S, event: E) => ResultCode, state: S, event: E) {
		return handleEvent(state, event);
	}

	decorateResult(res: ResultCode, state: S, event: E): ResultCode {
		return res;
	}
}
