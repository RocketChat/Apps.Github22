import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IAuthData } from '@rocket.chat/apps-engine/definition/oauth2/IOAuth2';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';

export async function repoDataMessage({
	repository,
	room,
	modify,
	http,
	accessToken,
}: {
	repository: string;
	room: IRoom;
	read: IRead;
	persistence: IPersistence;
	modify: IModify;
	http: IHttp;
	accessToken?: IAuthData;
}) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let gitResponse: any;
	if (accessToken?.token) {
		gitResponse = await http.get(
			`https://api.github.com/repos/${repository}`,
			{
				headers: {
					Authorization: `token ${accessToken?.token}`,
					'Content-Type': 'application/json',
				},
			},
		);
	} else {
		gitResponse = await http.get(
			`https://api.github.com/repos/${repository}`,
		);
	}
	const resData = gitResponse.data;
	const fullName =
		'[' + resData.full_name + '](' + resData.html_url + ')' + ' ▫️ ';
	const stars = '` ⭐ Stars ' + resData.stargazers_count + ' ` ';
	const issues = '` ❗ Issues ' + resData.open_issues + ' ` ';
	const forks = '` 🍴 Forks ' + resData.forks_count + ' ` ';
	let tags = '';
	if (resData && resData.topics && Array.isArray(resData.topics)) {
		resData.topics.forEach((topic: string) => {
			let tempTopic = ' ` ';
			tempTopic += topic;
			tempTopic += ' ` ';
			tags += tempTopic;
		});
	}

	const description = resData.description || 'No description provided.';

	const textSender = await modify
		.getCreator()
		.startMessage()
		.setText(
			fullName + stars + issues + forks + '`' + description + '`' + tags,
		);
	if (room) {
		textSender.setRoom(room);
	}
	await modify.getCreator().finish(textSender);
}
