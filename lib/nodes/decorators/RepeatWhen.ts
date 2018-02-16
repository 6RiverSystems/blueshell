'use strict';

import {Base} from '../Base';
import {RepeatWhenNTimes, ResultConditional} from "./RepeatWhenNTimes";


export class RepeatWhen<State> extends RepeatWhenNTimes<State> {

	constructor(desc: String, child: Base<State>, conditional: ResultConditional) {
		super('ResultWhen-' + desc, child, conditional, -1);
	}

}
