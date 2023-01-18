import { IfElse } from './IfElse';
import { BlueshellState, ResultCode, rc, BaseNode } from '../models';

export class IfElseWithNodeCondition<S extends BlueshellState, E> extends IfElse<S, E> {
	// below variable is used to communicate the result of running the conditionNode between
	// onEvent() and the callback passed to IfElse in the super() call
	private conditionResult = false;

	constructor(
		name: string,
		private readonly conditionNode: BaseNode<S, E>,
		consequent: BaseNode<S, E>,
		alternative?: BaseNode<S, E> | ResultCode,
	) {
		super(name, () => this.conditionResult, consequent, alternative);
	}

	getChildren() {
		return [this.conditionNode, ...super.getChildren()];
	}

	protected onEvent(state: S, event: E) {
		const res = this.conditionNode.handleEvent(state, event);
		if (res === rc.SUCCESS) {
			this.conditionResult = true;
			return super.onEvent(state, event);
		} else if (res === rc.FAILURE) {
			this.conditionResult = false;
			return super.onEvent(state, event);
		} else {
			return res;
		}
	}
}
