import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { GithubApp } from '../GithubApp';
import { getWebhookUrl } from '../helpers/getWebhookURL';
import {
	createSubscription,
	updateSubscription,
	deleteSubscription,
} from '../helpers/githubSDK';
import { sendNotification } from '../lib/message';
import { subscriptionsModal } from '../modals/subscriptionsModal';
import { getAccessTokenForUser } from '../persistance/auth';
import { Subscription } from '../persistance/subscriptions';
import { HandleInvalidRepoName } from './HandleInvalidRepoName';

export async function SubscribeAllEvents(
	read: IRead,
	context: SlashCommandContext,
	app: GithubApp,
	command: string[],
	persistence: IPersistence,
	http: IHttp,
	room: IRoom,
	modify: IModify,
) {
	let accessToken = await getAccessTokenForUser(
		read,
		context.getSender(),
		app.oauth2Config,
	);
	const repository = command[0];
	if (accessToken && accessToken?.token) {
		try {
			const sender = context.getSender();
			const isValidRepo = await HandleInvalidRepoName(
				repository,
				http,
				app,
				modify,
				sender,
				read,
				room,
			);

			if (!isValidRepo) {
				return;
			}

			let events: Array<string> = [
				'pull_request',
				'push',
				'issues',
				'deployment_status',
				'star',
			];
			//if hook exists we set its take its hook id and add our aditional events to it
			let eventSusbcriptions = new Map<string, boolean>();
			//this helps us mark the new events to be added
			for (let event of events) {
				eventSusbcriptions.set(event, false);
			}
			let url = await getWebhookUrl(app);
			let subscriptionStorage = new Subscription(
				persistence,
				read.getPersistenceReader(),
			);
			let user = context.getSender();
			let repositorySubscriptions =
				await subscriptionStorage.getSubscriptionsByRepo(
					repository,
					user.id,
				);
			let hookId = '';
			for (let susbcription of repositorySubscriptions) {
				if (hookId == '') {
					hookId = susbcription.webhookId;
				}
				eventSusbcriptions.set(susbcription.event, true);
			}
			let newEvents: Array<string> = [];
			for (let [event, value] of eventSusbcriptions) {
				if (!value) {
					newEvents.push(event);
				}
			}
			let createdEntry = false;
			if (hookId == '') {
				let response = await createSubscription(
					http,
					repository,
					url,
					accessToken.token,
					events,
				);
				hookId = response.id;
			} else {
				if (newEvents.length) {
					let response = await updateSubscription(
						http,
						repository,
						accessToken.token,
						hookId,
						events,
					);
					hookId = response.id;
				}
			}
			for (let event of events) {
				createdEntry = await subscriptionStorage.createSubscription(
					repository,
					event,
					hookId,
					room,
					context.getSender(),
				);
			}
			if (!createdEntry) {
				throw new Error('Error creating new susbcription entry');
			}

			await sendNotification(
				read,
				modify,
				context.getSender(),
				room,
				`Subscibed to ${repository} ✔️`,
			);
		} catch (error) {
			console.log('SubcommandError', error);
		}
	} else {
		await sendNotification(
			read,
			modify,
			context.getSender(),
			room,
			'Login to subscribe to repository events ! `/github login`',
		);
	}
}

export async function UnsubscribeAllEvents(
	read: IRead,
	context: SlashCommandContext,
	app: GithubApp,
	command: string[],
	persistence: IPersistence,
	http: IHttp,
	room: IRoom,
	modify: IModify,
) {
	let accessToken = await getAccessTokenForUser(
		read,
		context.getSender(),
		app.oauth2Config,
	);
	const repository = command[0];
	if (accessToken && accessToken?.token) {
		try {
			let user = await context.getSender();
			const isValidRepo = await HandleInvalidRepoName(
				repository,
				http,
				app,
				modify,
				user,
				read,
				room,
			);

			if (!isValidRepo) {
				return;
			}

			let events: Array<string> = [
				'pull_request',
				'push',
				'issues',
				'deployment_status',
				'star',
			];
			let subscriptionStorage = new Subscription(
				persistence,
				read.getPersistenceReader(),
			);
			let oldSubscriptions =
				await subscriptionStorage.getSubscriptionsByRepo(
					repository,
					user.id,
				);
			await subscriptionStorage.deleteSubscriptionsByRepoUser(
				repository,
				room.id,
				user.id,
			);
			let hookId = '';
			//check if any subscription events of the repo is left in any other room
			let eventSubscriptions = new Map<string, boolean>();
			for (let subscription of oldSubscriptions) {
				eventSubscriptions.set(subscription.event, false);
				if (hookId == '') {
					hookId = subscription.webhookId;
				}
			}
			let updatedsubscriptions =
				await subscriptionStorage.getSubscriptionsByRepo(
					repository,
					user.id,
				);
			if (updatedsubscriptions.length == 0) {
				await deleteSubscription(
					http,
					repository,
					accessToken.token,
					hookId,
				);
			} else {
				for (let subscription of updatedsubscriptions) {
					eventSubscriptions.set(subscription.event, true);
				}
				let updatedEvents: Array<string> = [];
				let sameEvents = true;
				for (let [event, present] of eventSubscriptions) {
					sameEvents = sameEvents && present;
					if (present) {
						updatedEvents.push(event);
					}
				}
				if (updatedEvents.length && !sameEvents) {
					let response = await updateSubscription(
						http,
						repository,
						accessToken.token,
						hookId,
						updatedEvents,
					);
				}
			}

			await sendNotification(
				read,
				modify,
				user,
				room,
				`Unsubscribed to ${repository} 🔕`,
			);
		} catch (error) {
			console.log('SubcommandError', error);
		}
	} else {
		await sendNotification(
			read,
			modify,
			context.getSender(),
			room,
			'Login to subscribe to repository events ! `/github login`',
		);
	}
}

export async function ManageSubscriptions(
	read: IRead,
	context: SlashCommandContext,
	app: GithubApp,
	persistence: IPersistence,
	http: IHttp,
	room: IRoom,
	modify: IModify,
) {
	let accessToken = await getAccessTokenForUser(
		read,
		context.getSender(),
		app.oauth2Config,
	);
	if (accessToken && accessToken.token) {
		const triggerId = context.getTriggerId();
		if (triggerId) {
			const modal = await subscriptionsModal({
				modify: modify,
				read: read,
				persistence: persistence,
				http: http,
				slashcommandcontext: context,
			});
			await modify
				.getUiController()
				.openModalView(modal, { triggerId }, context.getSender());
		} else {
			console.log('Invalid Trigger ID !');
		}
	} else {
		await sendNotification(
			read,
			modify,
			context.getSender(),
			room,
			'Login to subscribe to repository events ! `/github login`',
		);
	}
}
