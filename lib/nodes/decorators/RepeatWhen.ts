import {ResultCode, BlueshellState, BaseNode} from '../../models';
import {Action} from '../Base';
import {Decorator} from '../Decorator';
import {clearChildEventSeen} from '../Parent';

/**
 * Given a state, event, and result code (from a child Node), return a boolean.
 * 1/12/16
 * @author Joshua Chaitin-Pollak
 */
export interface Conditional<S, E> {
	(state: S, event: E, res: ResultCode): boolean;
}

/**
 * Given a conditional, have the child Node repeat handling of the event.
 * 1/12/16
 * @author Joshua Chaitin-Pollak
 */
export class RepeatWhen<S extends BlueshellState, E> extends Decorator<S, E> {
	constructor(desc: string,
	            child: BaseNode<S, E>,
	            private conditional: Conditional<S, E>) {
		super('RepeatWhen-' + desc, child);
	}

	/**
	 * Executes the conditional with the given state, event, and child result.
	 * Child is repeated depending on result of conditional.
	 * @override
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 */
	protected decorateResult(res: ResultCode, state: S, event: E): ResultCode {
		if (this.conditional(state, event, res)) {
			// publish the tree before we reset so we can see the result
			Action.treePublisher.publishResult(state, event, false);
			clearChildEventSeen(this, state);
			return this.handleEvent(state, event);
		} else {
			return res;
		}
	}

	get symbol(): string {
		return '↻';
	}
}
