/* eslint-disable no-console, @typescript-eslint/no-unused-vars, no-await-in-loop */

import * as rl from 'readline';
import * as Blueshell from '../lib';

const readline = rl.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const question = async function(prompt: string): Promise<string> {
	return await new Promise((resolve) => {
		readline.question(prompt, resolve);
	});
};

class CombinationLockState implements Blueshell.BlueshellState {
    __blueshell = {};
}

class Combo extends Blueshell.RunningAction<Blueshell.BlueshellState, 'exit' | number> {
	constructor(
		name: string,
        private readonly expected: number,
	) {
		super(name);
	}

	protected isCompletionEvent(event: number | 'exit'): boolean {
		return event === this.expected;
	}

	protected onComplete(state: Blueshell.BlueshellState, event: number | 'exit') {
		console.log('you got it!');
		return super.onComplete(state, event);
	}

	protected onIncomplete(state: Blueshell.BlueshellState, event: number | 'exit') {
		console.log('nope');
		return super.onIncomplete(state, event);
	}

	protected activate(state: Blueshell.BlueshellState, event: number | 'exit'): Blueshell.ResultCode {
		// just return running here, so if two combos have the same passwd in a row then the passwd
		// needs to be entered twice
		return Blueshell.resultCodes.RUNNING;
	}
}

class Exit extends Blueshell.Action<Blueshell.BlueshellState, number | 'exit'> {
	onEvent(state: Blueshell.BlueshellState, event: number | 'exit') {
		if (event === 'exit') {
			state.__blueshell = {};
			return Blueshell.resultCodes.SUCCESS;
		} else {
			return Blueshell.resultCodes.FAILURE;
		}
	}
}

const behavior = new Blueshell.Selector('ExitOrHandleNumber', [
	new Exit(),
	new Blueshell.LatchedSequence('CombinationLock', [
		new Combo('First', Math.floor(Math.random() * 10)),
		new Combo('Second', Math.floor(Math.random() * 10)),
		new Combo('Third', Math.floor(Math.random() * 10)),
	]),
]);

async function main() {
	const state = new CombinationLockState();
	let result: Blueshell.ResultCode = Blueshell.resultCodes.ERROR;
	while (result !== Blueshell.resultCodes.SUCCESS) {
		const number = await question('Enter a number, or exit: ');
		result = behavior.handleEvent(state, Number.parseInt(number));
	}

	console.log('solved');
	readline.close();
}

main().catch(console.error);
