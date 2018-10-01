/**
 * Created by jpollak on 5/29/16.
 */
import {Base} from './Base';
import {BlueshellState} from './BlueshellState';
import {resultCodes as rc} from '../utils/resultCodes';

export interface Conditional<S, E> {
	(state: S, event: E): boolean;
}

/**
 * If-Else Conditional Composite Node.
 *
 * If `conditional(state: S, event: E)` returns true,
 * control is passed to the consequent node.
 *
 * If `conditional(state: S, event: E)` returns false,
 * control is passed to the alternative node, or
 * if one is not provided, 'FAILURE' is returned.
 *
 * 5/29/16
 * @author Joshua Chaitin-Pollak
 */
export class IfElse<S extends BlueshellState, E> extends Base<S, E> {

	constructor(name: string,
	            private conditional: Conditional<S, E>,
	            private consequent: any,
	            private alternative?: any) {
		super(name);
	}

	/**
	 * Returns the children of this node, i.e. the `consequent` and the optional `alternative`.
	 */
	get children() {
		let children = [this.consequent];

		if (this.alternative) {
			children.push(this.alternative);
		}

		return children;
	}

	/**
	 * If `conditional` resolves to `true`, then the `consequent` node handles the event.
	 * Otherwise, the `alternative` node handles the event.
	 * If no `alternative` is provided, this node resolves to `FAILURE`
	 * @override
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 * @param i The child index.
	 */
	onEvent(state: S, event: E) {

		if (this.conditional(state, event)) {
			return this.consequent.handleEvent(state, event);
		} else if (this.alternative) {
			return this.alternative.handleEvent(state, event);
		} else {
			return rc.FAILURE;
		}
	}

	get symbol(): string {
		return '?';
	}
}
