'use strict';

var Rx = require('rx');

/*
 * clazz must implement the following methods:
 *
 * - static publishedStateMapper - maps an instance of clazz (the state)
 * to a publicly visible form.
 */
function LogicalComponent(name, eventStream, Clazz) {
	var state = new Clazz();

	var publishedStateStream =
		// Publish the output of the initial state
		Rx.Observable.return(Clazz.publishedStateMapper(state))
			// For each event, filter to make sure it is for us
			// then apply our current state and the current event
			// to eventProcessor, which returns the new state (for use with the
			// next event). Finally, return the public state for external consumption.
			.concat(eventStream
				//.filter(Clazz.componentFilter(this, name))
				.map(function(ev) {
					return ev.event;
				})
				.scan(Clazz.handleEvent, state)
				.map(Clazz.publishedStateMapper));

	return {
		name: name,
		getStateStream: function() {
			return publishedStateStream;
		}
	};
}
