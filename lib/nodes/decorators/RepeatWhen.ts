/**
 * Created by josh on 1/12/16.
 */
'use strict';

import {Decorator} from '../Decorator';
import {Action} from '../Action';
import {ResultCodes} from '../../utils/ResultCodes';

//TODO: This is stupid - might as well pass state and event as well
export interface ResultConditional {
	(result: ResultCodes): boolean;
}

export class RepeatWhen extends Decorator {

	conditional: ResultConditional;

	constructor(desc: string, child: Action, conditional: ResultConditional) {
		super('RepeatWhen-' + desc, child);
		this.conditional = conditional;
	}

	onEvent(state: any, event: any): Promise<ResultCodes> {

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
