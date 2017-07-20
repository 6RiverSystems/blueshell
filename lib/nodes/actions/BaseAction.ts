'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Action} from './Action';

export abstract class BaseAction<State, Event> extends Action<State, Event> {
	log: any;

	reactivatable: boolean;

	constructor(name: string) {
		super(name);

		this.reactivatable = false;
	}

	makeCommand(mfp: any, event: Event): any {
		throw new Error('Abstract Method must be implemented by children');
	}

	onEvent(state: State, event: any): Promise<ResultCodes> {
		// if the node is reactivatable, and we get a reactivate event, call activate
		const reactivate = event.type === 'reactivate' && this.reactivatable;
		const storage = this.getNodeStorage(state);

		if (reactivate || storage.lastResult !== ResultCodes.RUNNING) {
			return this.activate(state, event);
		} else {
			return this.runningEvent(state, event);
		}
	}

	activate(state: State, event: any): Promise<ResultCodes> {
		this.log.debug(`${this.name}: Activate`);

		return Promise.resolve(ResultCodes.RUNNING);
	}

	abstract isCompletionEvent(event: any): boolean;

	onComplete(state: State, event: any) {
		this.log.debug(`${this.name}: onComplete`);
	}

	runningEvent(state: State, event: any): Promise<ResultCodes> {
		this.log.debug(`${this.name}: runningEvent`);

		let result = ResultCodes.RUNNING;

		if (this.isCompletionEvent(event)) {
			this.log.debug(`${this.name}: Event type '${event.type}' matches done condition`);
			this.onComplete(state, event);
			result = ResultCodes.SUCCESS;
		}

		return Promise.resolve(result);
	}

}
