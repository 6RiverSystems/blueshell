import {BlueshellState} from './BlueshellState';
import {Base} from './Base';
import {Composite} from './Composite';
import {ResultCode} from '../utils/resultCodes';

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
	constructor(name: string, child: Base<S, E>) {
		super(name, [child]);
	}

	get child() {
		return this.children[0];
	}

	/**
	 * Passthrough to child Node.
	 * @param state
	 * @param event
	 */
	async onEvent(state: S, event: E): Promise<ResultCode> {
		// Passthrough
		return await this.child.handleEvent(state, event);
	}
}
