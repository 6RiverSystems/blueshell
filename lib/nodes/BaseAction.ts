'use strict';

import {Action} from './Action';
import {ResultCodes} from '../utils/ResultCodes';

export class BaseAction extends Action {
	log: any;

	reactivatable: boolean;

	constructor(name) {
		super(name);

		this.reactivatable = false;
	}

	makeCommand(mfp: any, event: any): any {
		throw new Error('Abstract Method must be implemented by children');
	}

	onEvent(state: any, event: any): Promise<ResultCodes> {
		// if the node is reactivatable, and we get a reactivate event, call activate
		const reactivate = event.type === 'reactivate' && this.reactivatable;
		const storage = this.getNodeStorage(state);

		if (reactivate || storage.lastResult !== ResultCodes.RUNNING) {
			return this.activate(state, event);
		} else {
			return this.runningEvent(state, event);
		}
	}

	setCommands(state: any, event: any) {
		let cmd = this.makeCommand(state, event);

		state.outgoingCommands = Array.isArray(cmd) ? cmd : [cmd];
	}

	activate(state: any, event: any): Promise<ResultCodes> {
		this.log.debug(`${this.name}: Activate`);
		this.setCommands(state, event);

		return Promise.resolve(ResultCodes.RUNNING);
	}

	isCompletionEvent(event: any): boolean {
		throw new Error('Abstract Method must be implemented by children');
	}

	onComplete(state: any, event: any) {
	}

	runningEvent(state: any, event: any): Promise<ResultCodes> {
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
