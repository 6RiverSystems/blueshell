'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Event} from '../../data/Event';
import {Action} from '../Action';
import {Decorator} from '../Decorator';

//TODO: This is stupid - might as well pass state and event as well
export interface ResultConditional {
	(result: ResultCodes): boolean;
}

export class RepeatWhen<State> extends Decorator<State> {

	conditional: ResultConditional;

	constructor(desc: string, child: Action<State>, conditional: ResultConditional) {
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
