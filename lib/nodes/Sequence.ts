import {BlueshellState, rc, ResultCode} from '../models';
import {Composite} from '.';

/**
 * Sends an event to each child until one of the returns `FAILURE`, or `RUNNING`, then returns that value.
 * If all children return `SUCCESS`, return `SUCCESS`.
 * 1/10/16
 * @author Joshua Chaitin-Pollak
 */
export class Sequence<S extends BlueshellState, E> extends Composite<S, E> {
	/**
	 * Recursively executes children until one of them returns
	 * failure. If we call all the children successfully, return success.
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 * @param i The child index.
	 */
	protected handleChild(state: S, event: E, i: number): ResultCode {
		const storage = this.getNodeStorage(state);

		// If we finished all processing without failure return success.
		if (i >= this.getChildren().length) {
			return rc.SUCCESS;
		}

		const child = this.getChildren()[i];

		const res = child.handleEvent(state, event);
		const {res: res_, state: state_, event: event_} =
			this._afterChild(res, state, event);

		if (res_ === rc.SUCCESS) {
			// Call the next child
			return this.handleChild(state_, event_, ++i);
		} else if (res_ === rc.UNDO) {
			// Call the previous child
			return this.handleChild(state_, event_, --i);
		} else {
			if (this.latched && res_ === rc.RUNNING) {
				storage.running = i;
			}

			return res_;
		}
	}

	/**
	 * @ignore
	 * @param res
	 * @param state
	 * @param event
	 */
	protected _afterChild(res: ResultCode, state: S, event: E) {
		return {res, state, event};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected undo(state: S, event: E, res: ResultCode) {
		// no-op
	}

	get symbol(): string {
		return '→';
	}
}
