'use strict';

import Composite = require('./Composite');
import Base = require('./Base');
import ResultCodes = require('../utils/ResultCodes');

class Decorator extends Composite {

	constructor(name: string, child: Base) {
		super(name, [child], undefined);
	}

	get child(): Base {
		return this.children[0];
	}

	onEvent(state: any, event: any): Promise<ResultCodes> {
		// Passthrough
		return this.child.handleEvent(state, event);
	}

}

export = Decorator;
