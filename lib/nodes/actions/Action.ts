'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Base} from '../Base';

export abstract class Action<State> extends Base<State> {

	constructor(name: string) {
		super(name);
	}

	onRun(state: State): Promise<ResultCodes> {
		const storage = this.getNodeStorage(state);

		if (storage.lastResult !== ResultCodes.RUNNING) {
			return this.activate(state);
		} else {
			return this.runningEvent(state);
		}
	}

	activate(state: State): Promise<ResultCodes> {
		return Promise.resolve(ResultCodes.RUNNING);
	}

	isComplete(state: State): boolean {
		return false;
	}

	onComplete(state: State): Promise<void> {
		return null;
	}

	runningEvent(state: State): Promise<ResultCodes> {

		let result = ResultCodes.RUNNING;

		if (this.isComplete(state)) {
			this.onComplete(state)
				.then(() => {
					return ResultCodes.SUCCESS;
				});
		}

		return Promise.resolve(result);
	}

}
