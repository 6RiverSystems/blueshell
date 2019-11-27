import {BlueshellState} from '../BlueshellState';
import {Base} from '../Base';
import {Decorator} from '../Decorator';
import {ResultCode} from '../../utils/resultCodes';

/**
 * Given a state, event, and result code (from a child Node), return a boolean.
 * 1/12/16
 * @author Joshua Chaitin-Pollak
 */
export interface Conditional<S, E> {
	(state: S, event: E, res: string): boolean;
}

/**
 * Given a conditional, have the child Node repeat handling of the event.
 * 1/12/16
 * @author Joshua Chaitin-Pollak
 */
export class RepeatWhen<S extends BlueshellState, E> extends Decorator<S, E> {
	constructor(desc: string,
	            child: Base<S, E>,
	            private conditional: Conditional<S, E>) {
		super('RepeatWhen-' + desc, child);
	}

	// @@@ HACK - any types
	clearChildEventSeen(node: any, state: S) {
		if (node.children) {
			node.children.forEach((child: any) => {
				this.clearChildEventSeen(child, state);
			});
		}
		const childStorage = node.getNodeStorage(state);
		childStorage.lastEventSeen = undefined;
	}

	/**
	 * Executes the conditional with the given state, event, and child result.
	 * Child is repeated depending on result of conditional.
	 * @override
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 */
	onEvent(state: S, event: E): ResultCode {
		const res = this.child.handleEvent(state, event);

		if (this.conditional(state, event, res)) {
			Base.treePublisher.publishResult(state, event, false);
			this.clearChildEventSeen(this, state);
			return this.handleEvent(state, event);
		} else {
			return res;
		}
	}

	get symbol(): string {
		return '↻';
	}
}
