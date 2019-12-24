import {BlueshellState} from '../BlueshellState';
import {Base} from '../Base';
import {Decorator} from '../Decorator';
import {ResultCode} from '../../utils/resultCodes';
import {isParentNode} from '../ParentNode';

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

	/**
	 * Clears the last event seen property of node and all of node's children
	 * @param node The node to clear
	 * @param state The state holding the node storage
	 */
	clearChildEventSeen(node: Base<S, E>, state: S) {
		if (isParentNode(node)) {
			node.getChildren().forEach((child: any) => {
				this.clearChildEventSeen(child, state);
			});
		}
		const nodeStorage = node.getNodeStorage(state);
		nodeStorage.lastEventSeen = undefined;
	}

	/**
	 * Executes the conditional with the given state, event, and child result.
	 * Child is repeated depending on result of conditional.
	 * @override
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 */
	decorateResult(res: ResultCode, state: S, event: E): ResultCode {
		if (this.conditional(state, event, res)) {
			// publish the tree before we reset so we can see the result
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
