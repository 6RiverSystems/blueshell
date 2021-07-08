import {activatable, RunningFn} from '../../lib/tree/activateable';
import {resultCodes, ResultCode} from '../../lib/utils/resultCodes';
import {BlueshellState} from '../../lib/nodes/BlueshellState';

// commandAction
function commandAction<S extends BlueshellState, E>(
	name: string,
	running: RunningFn<S, E> = () => resultCodes.SUCCESS,
) {
	const setCommands = function(mfp: S, event: E) {
		// const makeResult = this.makeCommand(mfp, event);
		// let cmds = Array.isArray(makeResult) ? makeResult : [makeResult];

		// if (mfp.debug && app.serviceConfig.enableVisualDebug) {
		// 	cmds = cmds.concat(DebugCommand.debug(mfp.id, mfp.debug));
		// }
		// mfp.outgoingCommands = cmds;
	};

	return activatable<S, E>(
		name,
		(s: S, event: E) => {
			console.log(`${this.name}: Activate`);
			setCommands(s, event);

			return resultCodes.RUNNING;
		},
		running
	)
}

export type isCompletionEventFn<S extends BlueshellState, E> = (state: S, event: E) => boolean;
export type onCompleteFn<S extends BlueshellState, E> = (state: S, event: E) => void;
export type onIncompleteFn<S extends BlueshellState, E> = (state: S, event: E) => void;

function running<S extends BlueshellState, E>(
	isCompletionEvent: isCompletionEventFn<S, E>,
	onComplete: onCompleteFn<S, E>,
	onIncomplete: onIncompleteFn<S, E>,
): RunningFn<S, E> {
	// log.debug(`${this.name}: runningEvent`);

	return (state: S, event: E) => {
		if (isCompletionEvent(state, event)) {
			// console.log(`${this.name}: Event type '${event.type}' matches done condition`);
			onComplete(state, event);
			return resultCodes.SUCCESS;
		} else {
			onIncomplete(state, event);
			return resultCodes.RUNNING;
		}
	}

}

interface TypedEvent {
	type: string
};

// simpleAction
function simpleAction<S extends BlueshellState, E extends TypedEvent>(
	name: string,
	doneEventType: string,
	onComplete: onCompleteFn<S, E> = () => {},
	onIncomplete: onIncompleteFn<S, E> = () => {},
) {
	return commandAction<S, E>(
		name,
		running(
			(s: S, event: E) => event.type === doneEventType,
			onComplete,
			onIncomplete,
		)
	);
}

class ButtonEvent implements TypedEvent {
	type: 'button'
	isAction: boolean
};

// buttonAction
function buttonAction<S extends BlueshellState, E extends TypedEvent>(
	name: string,
	doneEventType: string,
	onComplete: onCompleteFn<S, E> = () => {},
	onIncomplete: onIncompleteFn<S, E> = () => {},
) {
	return simpleAction<S, E>(
		name,
		'button',
		(state: S, event: E) => {
			return super.isCompletionEvent(event) &&
			(event instanceof ButtonEvent) &&
			event.isAction;
		}
	);
}

describe('complexTree', function() {
	it('should build a complex tree', function() {
		const bootup = activatable(
			'bootup',
			() => resultCodes.RUNNING,
			() => resultCodes.SUCCESS,
		);

		const waitForClick =

		const fullTree = latchedSequence([
			bootup,
		]);

		fullTree.handleEvent();
	});
});
