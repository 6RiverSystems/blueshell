import {ResultCode, BlueshellState, BaseNode, rc, Conditional} from '../../models';
import {Action} from '../Base';
import {Decorator} from '../Decorator';
import {clearChildEventSeen} from '../Parent';

/**
 * Given a conditional, have the child Node handle an event given a while condition
 * 11/9/21
 * @author Timothy Deignan
 */
export class While<S extends BlueshellState, E> extends Decorator<S, E> {
	constructor(
		desc: string,
		child: BaseNode<S, E>,
		private conditional: Conditional<S, E>,
		private readonly defaultResult: ResultCode = rc.SUCCESS,
	) {
		super('While-' + desc, child);
	}

	protected decorateCall(handleEvent: (state: S, event: E) => ResultCode, state: S, event: E) {
		const storage = this.getNodeStorage(state);

		if (storage.running || this.conditional(state, event)) {
			return handleEvent(state, event);
		} else {
			return this.defaultResult;
		}
	}

	protected decorateResult(res: ResultCode, state: S, event: E): ResultCode {
		if (this.conditional(state, event)) {
			Action.treePublisher.publishResult(state, event, false);
			clearChildEventSeen(this, state);
			return this.handleEvent(state, event);
		} else {
			return res;
		}
	}

	get latched() {
		return true;
	}

	get symbol(): string {
		return '↻';
	}
}
