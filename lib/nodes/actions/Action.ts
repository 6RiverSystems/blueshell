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

	abstract isCompletionRun(event: any): boolean;

	onComplete(state: State) {
	}

	runningEvent(state: State): Promise<ResultCodes> {

		let result = ResultCodes.RUNNING;

		if (this.isCompletionRun(event)) {
			this.onComplete(state);
			result = ResultCodes.SUCCESS;
		}

		return Promise.resolve(result);
	}

}
