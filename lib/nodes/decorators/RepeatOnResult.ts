/**
 * Created by josh on 1/12/16.
 */
'use strict';

import {RepeatWhen} from './RepeatWhen';
import {Action} from '../Action';
import {ResultCodes} from '../../utils/ResultCodes';

export class RepeatOnResult extends RepeatWhen {

	constructor(repeatRes: ResultCodes, child: Action) {
		super('ResultEquals-' + repeatRes, child, (res) => res === repeatRes);
	}

}
