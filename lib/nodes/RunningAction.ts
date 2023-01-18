import {Action} from './Base';
import {BlueshellState, ResultCode, rc} from '../models';

export abstract class RunningAction<S extends BlueshellState, E> extends Action<S, E> {
	constructor(name: string) {
		super(name);
	}

	protected onEvent(state: S, event: E): ResultCode {
		const storage = this.getNodeStorage(state);

		if (storage.lastResult !== rc.RUNNING) {
			return this.activate(state, event);
		} else {
			return this.runningEvent(state, event);
		}
	}

	protected _afterEvent(res: ResultCode, state: S, event: E) {
		if (res !== rc.RUNNING) {
			this.deactivate(state, event, res);
		}
		return super._afterEvent(res, state, event);
	}

	protected abstract isCompletionEvent(event: E, state: S): boolean;

	protected abstract activate(state: S, event: E): ResultCode;

	protected runningEvent(state: S, event: E): ResultCode {
		if (this.isCompletionEvent(event, state)) {
			return this.onComplete(state, event);
		} else {
			return this.onIncomplete(state, event);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected onComplete(state: S, event: E) {
		return rc.SUCCESS;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected onIncomplete(state: S, event: E) {
		return rc.RUNNING;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected deactivate(state: S, event: E, res: ResultCode) {
		// no-op
	}
}
