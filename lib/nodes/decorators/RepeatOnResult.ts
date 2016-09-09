/**
 * Created by josh on 1/12/16.
 */
'use strict';

import {RepeatWhen} from './RepeatWhen';
import {Base} from '../Base';
import {ResultCodes} from '../../utils/ResultCodes';

export class RepeatOnResult extends RepeatWhen {

	constructor(repeatRes: ResultCodes, child: Base) {
		super('ResultEquals-' + repeatRes, child, (res) => res === repeatRes);
	}

}
