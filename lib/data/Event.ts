'use strict';

import * as uuid from 'uuid';

export class Event {
	id: string;

	channelType: string;

	channelId: string;

	type: string;

	data: any;

	constructor(channelType: string, channelId: string, type: string, data?: any) {
		this.id = uuid.v4();

		this.channelType = channelType;
		this.channelId = channelId;
		this.type = type;
		this.data = data;
	}
}
