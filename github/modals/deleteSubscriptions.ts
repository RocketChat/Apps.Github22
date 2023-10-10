import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	ITextObject,
	TextObjectType,
} from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { ModalsEnum } from '../enum/Modals';
// import { getRoomTasks, getUIData, persistUIData } from '../lib/persistence';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import {
	getInteractionRoomData,
	storeInteractionRoomData,
} from '../persistance/roomInteraction';
import { Subscription } from '../persistance/subscriptions';
import { ISubscription } from '../definitions/subscription';
import { IRepositorySubscriptions } from '../definitions/repositorySubscriptions';

export async function deleteSubscriptionsModal({
	modify,
	read,
	persistence,
	slashcommandcontext,
	uikitcontext,
}: {
	modify: IModify;
	read: IRead;
	persistence: IPersistence;
	http: IHttp;
	slashcommandcontext?: SlashCommandContext;
	uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
	const viewId = ModalsEnum.DELETE_SUBSCRIPTION_VIEW;

	const block = modify.getCreator().getBlockBuilder();

	const room =
		slashcommandcontext?.getRoom() ||
		uikitcontext?.getInteractionData().room;
	const user =
		slashcommandcontext?.getSender() ||
		uikitcontext?.getInteractionData().user;

	if (user?.id) {
		let roomId;
		if (room?.id) {
			roomId = room.id;
			await storeInteractionRoomData(persistence, user.id, roomId);
		} else {
			roomId = (
				await getInteractionRoomData(
					read.getPersistenceReader(),
					user.id,
				)
			).roomId;
		}

		const subscriptionStorage = new Subscription(
			persistence,
			read.getPersistenceReader(),
		);
		const roomSubscriptions: Array<ISubscription> =
			await subscriptionStorage.getSubscriptions(roomId);

		block.addDividerBlock();

		const repositoryData = new Map<string, IRepositorySubscriptions>();
		for (const subscription of roomSubscriptions) {
			const repoName = subscription.repoName;
			const userId = subscription.user;
			const event = subscription.event;
			const user = await read.getUserReader().getById(userId);

			if (repositoryData.has(repoName)) {
				const repoData = repositoryData.get(
					repoName,
				) as IRepositorySubscriptions;
				repoData.events.push(event);
				repoData.user = user;
				repositoryData.set(repoName, repoData);
			} else {
				const events: Array<string> = [];
				events.push(event);
				const repoData: IRepositorySubscriptions = {
					webhookId: subscription.webhookId,
					events: events,
					user: user,
					repoName: repoName,
				};
				repositoryData.set(repoName, repoData);
			}
		}
		let index = 1;
		for (const repository of repositoryData.values()) {
			const repoName = repository.repoName;
			const repoUser = repository.user;
			const events = repository.events;
			if (repoUser.id == user.id) {
				block.addSectionBlock({
					text: {
						text: `${index}) ${repoName}`,
						type: TextObjectType.PLAINTEXT,
					},
					accessory: block.newButtonElement({
						actionId: ModalsEnum.DELETE_SUBSCRIPTION_ACTION,
						text: {
							text: ModalsEnum.DELETE_SUBSCRIPTION_LABEL,
							type: TextObjectType.PLAINTEXT,
						},
						value: repoName + ',' + repository.webhookId,
					}),
				});
			} else {
				block.addSectionBlock({
					text: {
						text: `${index}) ${repoName}`,
						type: TextObjectType.PLAINTEXT,
					},
				});
			}

			const eventList: Array<ITextObject> = [];
			eventList.push(block.newPlainTextObject('Events : '));
			for (const event of events) {
				eventList.push(block.newPlainTextObject(`${event} `));
			}
			block.addContextBlock({ elements: eventList });
			index = index + 1;
		}
	}

	block.addDividerBlock();

	return {
		id: viewId,
		title: {
			type: TextObjectType.PLAINTEXT,
			text: ModalsEnum.DELETE_SUBSCIPTIONS_TITLE,
		},
		close: block.newButtonElement({
			text: {
				type: TextObjectType.PLAINTEXT,
				text: 'Close',
			},
		}),
		blocks: block.getBlocks(),
	};
}
