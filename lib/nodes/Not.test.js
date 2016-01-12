/**
 * Created by josh on 1/12/16.
 */
'use strict';

var test = require('tape');

var Action = require('./Base');
var Not = require('./Not');

class EchoAction extends Action {

	handleEvent(state, event) {
		return {
			result: event,
			state
		};
	}
}

test('Base Path Test', function(t) {

	var echo = new EchoAction();
	var unEcho = new Not('unEcho', echo);

	t.equal(echo.handleEvent({}, 'SUCCESS').result, 'SUCCESS', 'Echo SUCCESS');
	t.equal(echo.handleEvent({}, 'FAILURE').result, 'FAILURE', 'Echo FAILURE');
	t.equal(echo.handleEvent({}, 'RUNNING').result, 'RUNNING', 'Echo RUNNING');
	t.equal(unEcho.handleEvent({}, 'SUCCESS').result, 'FAILURE', 'Inverse of SUCCESS');
	t.equal(unEcho.handleEvent({}, 'FAILURE').result, 'SUCCESS', 'Inverse of FAILURE');
	t.equal(unEcho.handleEvent({}, 'RUNNING').result, 'RUNNING', 'Passthrough');

	t.end();

});
