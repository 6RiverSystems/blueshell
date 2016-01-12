'use strict';

var Composite = require('./Composite');

class Decorator extends Composite {

	constructor(name, child) {
		super(name, [child]);
	}

}

module.exports = Decorator;
