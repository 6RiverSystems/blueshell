'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Action} from '../actions/Action';
import {Decorator} from '../Decorator';

//TODO: This is stupid - might as well pass state and event as well
export interface ResultConditional {
	(result: ResultCodes): boolean;
}

export class RepeatWhen<State, Event> extends Decorator<State, Event> {

	conditional: ResultConditional;

	constructor(desc: string, child: Action<State, Event>, conditional: ResultConditional) {
		super('RepeatWhen-' + desc, child);
		this.conditional = conditional;
	}

	onEvent(state: State, event: Event): Promise<ResultCodes> {

		let p = this.child.handleEvent(state, event);

		return p.then(res => {
			if (this.conditional(res)) {
				return this.handleEvent(state, event);
			} else {
				return res;
			}
		});
	}
}
