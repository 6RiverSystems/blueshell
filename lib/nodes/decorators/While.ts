import {ResultCode, BlueshellState, BaseNode, rc, Conditional, NodeStorage} from '../../models';
import {Action} from '../Base';
import {Decorator} from '../Decorator';
import {clearChildEventSeen} from '../Parent';

interface WhileNodeStorage extends NodeStorage {
	ranAtLeastOnce?: boolean,
	break?: boolean,
}

/**
 * Given a conditional, have the child Node handle an event given a while condition
 * 11/9/21
 * @author Timothy Deignan
 */
export class While<S extends BlueshellState, E> extends Decorator<S, E> {
	constructor(
		desc: string,
		private conditional: Conditional<S, E>,
		child: BaseNode<S, E>,
		private readonly defaultResult: ResultCode = rc.SUCCESS,
	) {
		super('While-' + desc, child);
	}

	protected decorateCall(handleEvent: (state: S, event: E) => ResultCode, state: S, event: E) {
		const storage: WhileNodeStorage = this.getNodeStorage(state);

		if (storage.running || this.conditional(state, event)) {
			storage.ranAtLeastOnce = true;
			return handleEvent(state, event);
		} else {
			storage.break = true;
			return storage.ranAtLeastOnce ? storage.lastResult as ResultCode : this.defaultResult;
		}
	}

	protected _afterEvent(res: ResultCode, state: S, event: E): ResultCode {
		res = super._afterEvent(res, state, event);

		const storage: WhileNodeStorage = this.getNodeStorage(state);

		if (res !== rc.RUNNING && !storage.break) {
			Action.treePublisher.publishResult(state, event, false);
			clearChildEventSeen(this, state);
			return this.handleEvent(state, event);
		} else {
			storage.break = undefined;
			storage.ranAtLeastOnce = undefined;
			return res;
		}
	}

	get symbol(): string {
		return '↻';
	}
}
