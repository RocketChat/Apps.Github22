import {
	IHttp,
	IMessageBuilder,
	IModify,
	IModifyCreator,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IAuthData } from '@rocket.chat/apps-engine/definition/oauth2/IOAuth2';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import {
	ISlashCommand,
	SlashCommandContext,
} from '@rocket.chat/apps-engine/definition/slashcommands';

export async function issueListMessage({
	repository,
	room,
	read,
	persistence,
	modify,
	http,
	accessToken,
}: {
	repository: String;
	room: IRoom;
	read: IRead;
	persistence: IPersistence;
	modify: IModify;
	http: IHttp;
	accessToken?: IAuthData;
}) {
	let gitResponse: any;
	if (accessToken?.token) {
		gitResponse = await http.get(
			`https://api.github.com/repos/${repository}/issues`,
			{
				headers: {
					Authorization: `token ${accessToken?.token}`,
					'Content-Type': 'application/json',
				},
			},
		);
	} else {
		gitResponse = await http.get(
			`https://api.github.com/repos/${repository}/issues`,
		);
	}
	const resData = gitResponse.data;
	const textSender = await modify
		.getCreator()
		.startMessage()
		.setText(`*ISSUES LIST*`);

	if (room) {
		textSender.setRoom(room);
	}
	let ind = 0;
	await modify.getCreator().finish(textSender);
	resData.forEach(async (issue) => {
		if (typeof issue.pull_request === 'undefined' && ind < 10) {
			issue.title = issue.title.replace(/[\[\]()`]/g, '');
			const textSender = await modify
				.getCreator()
				.startMessage()
				.setText(
					`[ #${issue.number} ](${issue.html_url})  *[${issue.title}](${issue.html_url})*`,
				);
			if (room) {
				textSender.setRoom(room);
			}
			await modify.getCreator().finish(textSender);
			ind++;
		}
	});
}
