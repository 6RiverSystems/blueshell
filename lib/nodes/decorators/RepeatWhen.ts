/**
 * Created by josh on 1/12/16.
 */
'use strict';

import Decorator = require('../Decorator');
import Base = require('../Base');
import ResultCodes = require('../../utils/ResultCodes');

//TODO: This is stupid - might as well pass state and event as well
interface ResultConditional {
	(result: ResultCodes): boolean;
}

class RepeatWhen extends Decorator {

	conditional: ResultConditional;

	constructor(desc: string, child: Base, conditional: ResultConditional) {
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

export = RepeatWhen;
