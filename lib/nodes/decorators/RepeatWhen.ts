import { ResultCode, BlueshellState, BaseNode, ConditionalWithResult } from '../../models';
import { Action } from '../Base';
import { Decorator } from '../Decorator';
import { clearEventSeenRecursive } from '../Parent';

/**
 * Given a conditional, have the child Node repeat handling of the event.
 * 1/12/16
 * @author Joshua Chaitin-Pollak
 */
export class RepeatWhen<S extends BlueshellState, E> extends Decorator<S, E> {
	constructor(
		desc: string,
		child: BaseNode<S, E>,
		private conditional: ConditionalWithResult<S, E>,
	) {
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
			clearEventSeenRecursive(this, state);
			return this.handleEvent(state, event);
		} else {
			return res;
		}
	}

	get symbol(): string {
		return '↻';
	}
}
