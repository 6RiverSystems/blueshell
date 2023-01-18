import { Switch } from './Switch';
import { BlueshellState, ResultCode, rc, BaseNode, Conditional } from '../models';

/**
 * Executes the child action associated with the first matching conditional.
 * Latches on that child action without re-checking the corresponding conditional until
 * it returns a result other than RUNNING. Returns defaultResult if no conditionals match.
 *
 * 11/9/21
 * @author Timothy Deignan
 */
export class LatchedSwitch<S extends BlueshellState, E> extends Switch<S, E> {
	protected onEvent(state: S, event: E) {
		const storage = this.getNodeStorage(state);

		if (storage.running !== undefined) {
			const entry = this.entries[storage.running];
			return entry.child.handleEvent(state, event);
		}

		const entry = this.entries.find((e) => e.conditional(state, event));

		if (entry) {
			const storage = this.getNodeStorage(state);
			storage.running = this.entries.indexOf(entry);
			return entry.child.handleEvent(state, event);
		}

		return this.defaultResult;
	}

	protected _afterEvent(res: ResultCode, state: S, event: E): ResultCode {
		res = super._afterEvent(res, state, event);

		if (res !== rc.RUNNING) {
			const storage = this.getNodeStorage(state);
			storage.running = undefined;
		}

		return res;
	}

	get latched() {
		return true;
	}
}
