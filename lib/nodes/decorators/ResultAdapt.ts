import {ResultCode, BlueshellState, BaseNode} from '../../models';
import {Decorator} from '..';

/**
 * Given a state, event, and result code (from a child Node), return a result code.
 * 7/30/21
 * @author Timothy Deignan
 */
export interface ResultAdapter<S, E> {
	(state: S, event: E, res: ResultCode): ResultCode;
}

/**
 * Given a ResultAdapter, adapts the result code from the child node.
 * 7/30/21
 * @author Timothy Deignan
 */
export class ResultAdapt<S extends BlueshellState, E> extends Decorator<S, E> {
	constructor(desc: string,
	            child: BaseNode<S, E>,
	            private resultAdapter: ResultAdapter<S, E>) {
		super('ResultAdapt-' + desc, child);
	}

	/**
	 * Executes the resultAdapter with the given state, event, and child result.
	 * @override
	 * @param res The result code return from the child node.
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 */
	protected decorateResult(res: ResultCode, state: S, event: E): ResultCode {
		return this.resultAdapter(state, event, res);
	}

	get symbol(): string {
		return '⊜→';
	}
}
