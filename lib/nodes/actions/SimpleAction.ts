'use strict';

import {BaseAction} from './BaseAction';

export class SimpleAction<State> extends BaseAction<State> {

	log: any;

	message: any;

	action: any;

	doneEvent: any;

	constructor(taskType, action, doneEvent, message) {
		super(`${taskType}_${action}`);

		this.action = action;
		this.doneEvent = typeof doneEvent !== 'undefined' ? doneEvent : 'input';
		this.message = typeof message !== 'undefined' ? message : undefined;

		this.log.debug({
			taskType,
			doneEvent: this.doneEvent
		}, `Created Action for ${taskType}-${action}`);
	}

	isCompletionEvent(event) {
		return event.type === this.doneEvent;
	}

}
