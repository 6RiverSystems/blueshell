'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Action} from './Action';

export abstract class BaseAction<State> extends Action<State> {
	log: any;

	constructor(name: string) {
		super(name);
	}

	onEvent(state: State): Promise<ResultCodes> {
		// if the node is reactivatable, and we get a reactivate event, call activate
		const storage = this.getNodeStorage(state);

		if (storage.lastResult !== ResultCodes.RUNNING) {
			return this.activate(state);
		} else {
			return this.runningEvent(state);
		}
	}

	activate(state: State): Promise<ResultCodes> {
		this.log.debug(`${this.name}: Activate`);

		return Promise.resolve(ResultCodes.RUNNING);
	}

	abstract isCompletionEvent(event: any): boolean;

	onComplete(state: State) {
		this.log.debug(`${this.name}: onComplete`);
	}

	runningEvent(state: State): Promise<ResultCodes> {
		this.log.debug(`${this.name}: runningEvent`);

		let result = ResultCodes.RUNNING;

		if (this.isCompletionEvent(event)) {
			this.log.debug(`${this.name}: Event type '${event.type}' matches done condition`);
			this.onComplete(state);
			result = ResultCodes.SUCCESS;
		}

		return Promise.resolve(result);
	}

}
