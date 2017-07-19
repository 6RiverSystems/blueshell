'use strict';

import {ResultCodes} from '../utils/ResultCodes';
import {Event} from '../data/Event';
import {Action} from './Action';

export class BaseAction<State> extends Action<State> {
	log: any;

	reactivatable: boolean;

	constructor(name) {
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

	setCommands(state: State, event: any) {
		let cmd = this.makeCommand(state, event);

		state.outgoingCommands = Array.isArray(cmd) ? cmd : [cmd];
	}

	activate(state: State, event: any): Promise<ResultCodes> {
		this.log.debug(`${this.name}: Activate`);
		this.setCommands(state, event);

		return Promise.resolve(ResultCodes.RUNNING);
	}

	isCompletionEvent(event: any): boolean {
		throw new Error('Abstract Method must be implemented by children');
	}

	onComplete(state: State, event: any) {
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
