import {ResultCode, BlueshellState, BaseNode, rc, Conditional, NodeStorage} from '../../models';
import {Action} from '../Base';
import {Decorator} from '../Decorator';
import {modifyLastEventSeenRecursive} from '../Parent';

interface WhileNodeStorage extends NodeStorage {
	beganAtLeastOneLoop?: boolean;
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
			if (storage.beganAtLeastOneLoop) {
				Action.treePublisher.publishResult(state, event, false);
				modifyLastEventSeenRecursive(this.child, state, () => ({action: 'clear'}));
			}
			storage.beganAtLeastOneLoop = true;
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
			// teardown internal state and yield to the behavior tree because the loop has completed

			// FIXME - it is likely that if While is used as the root node, the that lastEventSeen
			// property of the decendants may not be correct due to the extra call to _beforeEvent
			// required for the while loop to break.			
			storage.beganAtLeastOneLoop = undefined;
			storage.lastLoopResult = undefined;
			storage.break = undefined;
			return res;
		} else {
			// begin another iteration of the loop
			storage.lastLoopResult = res;
			return this.handleEvent(state, event);
		}
	}

	get symbol(): string {
		return '↻';
	}
}
