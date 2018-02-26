/**
 * Created by josh on 1/21/16.
 */
import {BlueshellState} from '../BlueshellState';
import {Base} from '../Base';
import {Decorator} from '../Decorator';

// Swaps one result from the child for another
// You can use this to mask FAILURE, etc
//
// For example, you can use this to have a Sequence continue operation
// when a child returns FAILURE.
export class ResultSwap<S extends BlueshellState, E> extends Decorator<S, E> {

	constructor(private _inResult: string,
							private _outResult: string,
							child: Base<S, E>,
							desc = `ResultSwap_${_inResult}-${_outResult}-${child.name}`) {
		super(desc, child);
	}

	onEvent(state: S, event: E) {
		let p = this.child.handleEvent(state, event);

		return p.then(res => {
			if (res === this._inResult) {
				res = this._outResult;
			}

			return res;
		});
	}
}
