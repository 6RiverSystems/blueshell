'use strict';

// See: http://stackoverflow.com/questions/21293063/how-to-programmatically-enumerate-an-enum-type-in-typescript-0-9-5
export class EnumEx {
	static getNamesAndValues(e: any) {
		return this.getNames(e).map(n => { return { name: n, value: e[n] as number }; });
	}

	static getNames(e: any) {
		return this.getObjValues(e).filter(v => typeof v === "string") as string[];
	}

	static getValues(e: any) {
		return this.getObjValues(e).filter(v => typeof v === "number") as number[];
	}

	private static getObjValues(e: any): (number | string)[] {
		return Object.keys(e).map(k => e[k]);
	}
}
