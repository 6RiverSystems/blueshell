import {ResultCode, BlueshellState, BaseNode, rc, Conditional, NodeStorage} from '../../models';
import {Action} from '../Base';
import {Decorator} from '../Decorator';
import {clearChildEventSeen} from '../Parent';

interface WhileNodeStorage extends NodeStorage {
	lastLoopResult?: ResultCode,
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
			return handleEvent(state, event);
		} else {
			storage.break = true;
			return storage.lastLoopResult || this.defaultResult;
		}
	}

	protected _afterEvent(res: ResultCode, state: S, event: E): ResultCode {
		res = super._afterEvent(res, state, event);

		const storage: WhileNodeStorage = this.getNodeStorage(state);

		if (res === rc.RUNNING) {
			// yield to the behavior tree because the child node is running
			return res;
		} else if (storage.break) {
			// teardown internal state and yield to the behavior tree beause the loop has completed
			storage.break = undefined;
			storage.lastLoopResult = undefined;
			return res;
		} else {
			// begin another iteration of the loop
			storage.lastLoopResult = res;
			Action.treePublisher.publishResult(state, event, false);
			clearChildEventSeen(this, state);
			return this.handleEvent(state, event);
		}
	}

	get symbol(): string {
		return '↻';
	}
}
