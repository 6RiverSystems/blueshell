import {activatable, RunningFn} from '../../lib/tree/activateable';
import {resultCodes, ResultCode} from '../../lib/utils/resultCodes';
import {BlueshellState} from '../../lib/nodes/BlueshellState';

export type isCompletionEventFn<S extends BlueshellState, E> = (state: S, event: E) => boolean;
export type onCompleteFn<S extends BlueshellState, E> = (state: S, event: E) => void;
export type onIncompleteFn<S extends BlueshellState, E> = (state: S, event: E) => void;

function mkRunningFn<S extends BlueshellState, E>(
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

interface ActionData {

}

interface CommandActionData<S extends BlueshellState, E extends TypedEvent> {
	name: string,
	running?: RunningFn<S, E>,
}


// commandAction
function commandAction<S extends BlueshellState, E extends TypedEvent>(
	actionData: CommandActionData<S, E>,
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
		actionData.name,
		(s: S, event: E) => {
			console.log(`${this.name}: Activate`);
			setCommands(s, event);

			return resultCodes.RUNNING;
		},
		// not works
		actionData.running || () => resultCodes.SUCCESS,
		// works
		// actionData.running ? actionData.running : () => resultCodes.SUCCESS,
	)
}


interface SimpleActionData<S extends BlueshellState, E extends TypedEvent> implements ActionData {
	name: string,
	doneEventType: string,
	onComplete?: onCompleteFn<S, E>,
	onIncomplete?: onIncompleteFn<S, E>,
}

// simpleAction
function simpleAction<S extends BlueshellState, E extends TypedEvent>(
	actionData: SimpleActionData<S, E>,
) {
	return commandAction<S, E>({
		name,
		running: mkRunningFn(
			(s: S, event: E) => event.type === actionData.doneEventType,
			actionData.onComplete || actionData.onComplete,
			actionData.onIncomplete || actionData.onIncomplete,
		)
	});
}


class ButtonEvent implements TypedEvent {
	type: 'button'
	isAction: boolean
};

// buttonAction
function buttonAction<S extends BlueshellState, E extends TypedEvent>(
) {
	return simpleAction<S, E>({
		name,
		'button',
		(state: S, event: E) => {
			return super.isCompletionEvent(event) &&
			(event instanceof ButtonEvent) &&
			event.isAction;
		}
	});
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
