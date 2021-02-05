/* eslint-disable no-console, @typescript-eslint/no-unused-vars, no-await-in-loop */
import * as Blueshell from '../lib';

require('keypress')(process.stdin);

function getRandomNumber() {
	return Math.floor(Math.random() * 10);
}

class CombinationLockState implements Blueshell.BlueshellState {
	__blueshell = {};
}

type ComboEvent = {
	value: number,
	direction: 'left' | 'right',
};

type ExitEvent = {
	value: 'exit',
};

type CombinationLockEvent = ComboEvent | ExitEvent;

function isExitEvent(event: any): event is ExitEvent {
	return !!event && typeof event === 'object' && event.value === 'exit';
}

function isComboEvent(event: any): event is ComboEvent {
	return !!event &&
		typeof event === 'object' &&
		!Number.isNaN(event.value) &&
		['left', 'right'].includes(event.direction);
}

let behavior: Blueshell.BaseNode<Blueshell.BlueshellState, CombinationLockEvent>; // eslint-disable-line

class Combo extends Blueshell.RunningAction<Blueshell.BlueshellState, CombinationLockEvent> {
	constructor(name: string, private readonly expected: number, private readonly direction: 'right' | 'left') {
		super(name);
		console.log(expected);
	}

	protected isCompletionEvent(event: CombinationLockEvent): boolean {
		if (isComboEvent(event)) {
			return event.value === this.expected;
		} else {
			return false;
		}
	}

	protected activate(state: Blueshell.BlueshellState, event: CombinationLockEvent): Blueshell.ResultCode {
		console.log('activate');
		return this.runningEvent(state, event);
	}

	protected runningEvent(state: Blueshell.BlueshellState, event: CombinationLockEvent): Blueshell.ResultCode {
		console.log('running');
		if (isComboEvent(event) && event.direction !== this.direction) {
			console.log('wrong direction, abort!!');
			behavior.resetNodeStorage(state);
		}

		return super.runningEvent(state, event);
	}

	// debug

	protected onComplete(state: Blueshell.BlueshellState, event: CombinationLockEvent) {
		console.log('you got it!');
		return super.onComplete(state, event);
	}

	protected onIncomplete(state: Blueshell.BlueshellState, event: CombinationLockEvent) {
		console.log('nope');
		return super.onIncomplete(state, event);
	}
}

class Exit extends Blueshell.Action<Blueshell.BlueshellState, CombinationLockEvent> {
	onEvent(state: Blueshell.BlueshellState, event: CombinationLockEvent) {
		if (isExitEvent(event)) {
			behavior.resetNodeStorage(state);
			return Blueshell.resultCodes.SUCCESS;
		} else {
			return Blueshell.resultCodes.FAILURE;
		}
	}
}

const numbers: number[] = [];

while (numbers.length < 3) {
	const num = getRandomNumber();
	if (!numbers.includes(num)) {
		numbers.push(num);
	}
}

const state = new CombinationLockState();
let currentValue = getRandomNumber();
let behaviorResult: Blueshell.ResultCode = Blueshell.resultCodes.ERROR;

behavior = new Blueshell.Selector('ExitOrHandleNumber', [
	new Exit(),
	new Blueshell.LatchedSequence(
		'CombinationLockSequence',
		numbers.map((n, i) => new Combo(`${n}`, n, i % 2 === 0 ? 'right' : 'left')),
	),
]);
console.log(`\n---\n\n${currentValue}`);

function isRightOrLeft(input: any): input is 'right' | 'left' {
	return input === 'right' || input === 'left';
}

function handleKeyPress(key: { name?: string; ctrl?: boolean }) {
	if (key && key.ctrl && key.name === 'c') {
		process.stdin.pause();
	} else if (isRightOrLeft(key.name)) {
		if (key.name === 'left') {
			currentValue--;
			if (currentValue < 0) {
				currentValue = 9;
			}
		} else if (key.name === 'right') {
			currentValue++;
			if (currentValue > 9) {
				currentValue = 0;
			}
		}

		behaviorResult = behavior.handleEvent(state, {value: currentValue, direction: key.name});
	} else if (key.name === 'down') {
		behaviorResult = behavior.handleEvent(state, {value: 'exit'});
	}


	if (behaviorResult === Blueshell.resultCodes.SUCCESS) {
		console.log('solved (...or exited?)');
		process.exit();
	}
	console.log(currentValue);
}

async function main() {
	process.stdin.on('keypress', (ch, key) => handleKeyPress(key));

	if (process.stdin.setRawMode) {
		process.stdin.setRawMode(true);
	}
	process.stdin.resume();
}

main().catch(console.error);
