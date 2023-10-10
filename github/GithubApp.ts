/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
	IAppAccessors,
	IAppInstallationContext,
	IConfigurationExtend,
	IHttp,
	ILogger,
	IMessageExtender,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { GithubCommand } from './commands/GithubCommand';
import {
	IUIKitResponse,
	UIKitBlockInteractionContext,
	UIKitViewCloseInteractionContext,
	UIKitViewSubmitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import { ExecuteViewClosedHandler } from './handlers/ExecuteViewClosedHandler';
import { ExecuteBlockActionHandler } from './handlers/ExecuteBlockActionHandler';
import { ExecuteViewSubmitHandler } from './handlers/ExecuteViewSubmitHandler';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import {
	IAuthData,
	IOAuth2Client,
	IOAuth2ClientOptions,
} from '@rocket.chat/apps-engine/definition/oauth2/IOAuth2';
import { createOAuth2Client } from '@rocket.chat/apps-engine/definition/oauth2/OAuth2';
import {
	sendDirectMessage,
	sendDirectMessageOnInstall,
	sendNotification,
} from './lib/message';
import { deleteOathToken } from './processors/deleteOAthToken';
import { ProcessorsEnum } from './enum/Processors';
import {
	ApiSecurity,
	ApiVisibility,
} from '@rocket.chat/apps-engine/definition/api';
import { githubWebHooks } from './endpoints/githubEndpoints';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import {
	clearInteractionRoomData,
	getInteractionRoomData,
} from './persistance/roomInteraction';
import { GHCommand } from './commands/GhCommand';
import {
	IPreMessageSentExtend,
	IMessage,
} from '@rocket.chat/apps-engine/definition/messages';
import { handleGitHubCodeSegmentLink } from './handlers/GitHubCodeSegmentHandler';
import { isGithubLink, hasGitHubCodeSegmentLink } from './helpers/checkLinks';

export class GithubApp extends App implements IPreMessageSentExtend {
	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	public async checkPreMessageSentExtend(
		message: IMessage,
	): Promise<boolean> {
		if (await isGithubLink(message)) {
			return true;
		}
		return false;
	}

	public async executePreMessageSentExtend(
		message: IMessage,
		extend: IMessageExtender,
		// @ts-ignore
		read: IRead,
		http: IHttp,
		// @ts-ignore
		persistence: IPersistence,
	): Promise<IMessage> {
		if (await hasGitHubCodeSegmentLink(message)) {
			await handleGitHubCodeSegmentLink(message, http, extend);
		}
		return extend.getMessage();
	}

	public async authorizationCallback(
		token: IAuthData,
		user: IUser,
		read: IRead,
		modify: IModify,
		// @ts-ignore
		http: IHttp,
		persistence: IPersistence,
	) {
		const deleteTokenTask = {
			id: ProcessorsEnum.REMOVE_GITHUB_LOGIN,
			when: '7 days',
			data: {
				user: user,
				config: this.oauth2Config,
			},
		};
		let text = `GitHub Authentication Successful 🚀`;
		const interactionData = await getInteractionRoomData(
			read.getPersistenceReader(),
			user.id,
		);

		if (token) {
			await modify.getScheduler().scheduleOnce(deleteTokenTask);
		} else {
			text = `Authentication Failure 😔`;
		}
		if (interactionData && interactionData.roomId) {
			const roomId = interactionData.roomId as string;
			const room = (await read.getRoomReader().getById(roomId)) as IRoom;
			await clearInteractionRoomData(persistence, user.id);
			await sendNotification(read, modify, user, room, text);
		} else {
			await sendDirectMessage(read, modify, user, text, persistence);
		}
	}

	public oauth2ClientInstance: IOAuth2Client;
	public oauth2Config: IOAuth2ClientOptions = {
		alias: 'github-app',
		accessTokenUri: 'https://github.com/login/oauth/access_token',
		authUri: 'https://github.com/login/oauth/authorize',
		refreshTokenUri: 'https://github.com/login/oauth/access_token',
		revokeTokenUri: `https://api.github.com/applications/client_id/token`,
		// @ts-ignore
		authorizationCallback: this.authorizationCallback.bind(this),
		defaultScopes: ['users', 'repo'],
	};

	public getOauth2ClientInstance(): IOAuth2Client {
		if (!this.oauth2ClientInstance) {
			// @ts-ignore
			this.oauth2ClientInstance = createOAuth2Client(
				this,
				this.oauth2Config,
			);
		}
		return this.oauth2ClientInstance;
	}

	public async executeBlockActionHandler(
		context: UIKitBlockInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse> {
		const handler = new ExecuteBlockActionHandler(
			this,
			read,
			http,
			modify,
			persistence,
		);
		return await handler.run(context);
	}

	public async executeViewClosedHandler(
		context: UIKitViewCloseInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	) {
		const handler = new ExecuteViewClosedHandler(
			read,
			http,
			modify,
			persistence,
		);
		return await handler.run(context);
	}

	public async executeViewSubmitHandler(
		context: UIKitViewSubmitInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	) {
		const handler = new ExecuteViewSubmitHandler(
			this,
			read,
			http,
			modify,
			persistence,
		);
		return await handler.run(context);
	}

	public async extendConfiguration(
		configuration: IConfigurationExtend,
	): Promise<void> {
		const gitHubCommand: GithubCommand = new GithubCommand(this);
		const ghCommand: GHCommand = new GHCommand(this);
		await Promise.all([
			configuration.slashCommands.provideSlashCommand(gitHubCommand),
			configuration.slashCommands.provideSlashCommand(ghCommand),
			this.getOauth2ClientInstance().setup(configuration),
		]);
		configuration.scheduler.registerProcessors([
			{
				id: ProcessorsEnum.REMOVE_GITHUB_LOGIN,
				processor: async (jobContext, read, modify, http, persis) => {
					const user = jobContext.user as IUser;
					const config = jobContext.config as IOAuth2ClientOptions;
					try {
						await deleteOathToken({
							user,
							config,
							read,
							modify,
							http,
							persis,
						});
					} catch (e) {
						await sendDirectMessage(
							read,
							modify,
							user,
							// @ts-ignore
							e.message,
							persis,
						);
					}
				},
			},
		]);
		configuration.api.provideApi({
			visibility: ApiVisibility.PUBLIC,
			security: ApiSecurity.UNSECURE,
			// @ts-ignore
			endpoints: [new githubWebHooks(this)],
		});
	}

	public async onInstall(
		context: IAppInstallationContext,
		read: IRead,
		// @ts-ignore
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void> {
		const user = context.user;
		await sendDirectMessageOnInstall(read, modify, user, persistence);
	}
}
