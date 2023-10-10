import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';

import { sendDirectMessage } from '../lib/message';
import { IJobContext } from '@rocket.chat/apps-engine/definition/scheduler';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import {
	getAccessTokenForUser,
	revokeUserAccessToken,
} from '../persistance/auth';
import { IOAuth2ClientOptions } from '@rocket.chat/apps-engine/definition/oauth2/IOAuth2';

export async function deleteOathToken({
	user,
	config,
	read,
	modify,
	http,
	persis,
}: {
	user: IUser;
	config: IOAuth2ClientOptions;
	read: IRead;
	modify: IModify;
	http: IHttp;
	persis: IPersistence;
}) {
	try {
		let token = await getAccessTokenForUser(read, user, config);
		if (token?.token) {
			await revokeUserAccessToken(read, user, persis, http, config);
		}
		token = await getAccessTokenForUser(read, user, config);
		await sendDirectMessage(
			read,
			modify,
			user,
			'GitHub Token Expired, Login to GitHub Again ! `/github login`',
			persis,
		);
	} catch (error) {
		console.log('deleteOathToken error : ', error);
	}
}
