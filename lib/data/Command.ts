'use strict';

import * as uuid from 'uuid';

export class Command {
	id: string;

	channelType: string;

	channelId: string;

	command: string;

	taskType: string;

	action: string;

	location: string;

	data: any;

	constructor(channelType: string, channelId: string, command: string,
							taskType: string, action: string, location: string, data: any) {
		this.id = uuid.v4();

		this.channelType = channelType;
		this.channelId = channelId;
		this.command = command;
		this.taskType = taskType;
		this.action = action;
		this.location = location;
		this.data = data;
	}
}
