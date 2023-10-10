import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { ModalsEnum } from '../enum/Modals';
import { AppEnum } from '../enum/App';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import {
	storeInteractionRoomData,
	getInteractionRoomData,
} from '../persistance/roomInteraction';
import { parseDate, parseTime } from '../helpers/dateTime';

export async function issueCommentsModal({
	data,
	modify,
	read,
	persistence,
	slashcommandcontext,
	uikitcontext,
}: {
	data?;
	modify: IModify;
	read: IRead;
	persistence: IPersistence;
	http: IHttp;
	slashcommandcontext?: SlashCommandContext;
	uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
	const viewId = ModalsEnum.ISSUE_COMMENTS_MODAL_VIEW;

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
		const issueData = data?.issueData;
		const issueComments = data?.issueComments;

		block.addSectionBlock({
			text: {
				text: `*${issueData?.title}*`,
				type: TextObjectType.MARKDOWN,
			},
		});
		block.addContextBlock({
			elements: [
				block.newPlainTextObject(`Author: ${issueData?.user_login} | `),
				block.newPlainTextObject(`State : ${issueData?.state} | `),
				block.newPlainTextObject(
					`Total Comments : ${issueComments?.length} |`,
				),
			],
		});

		block.addActionsBlock({
			elements: [
				block.newButtonElement({
					actionId: ModalsEnum.COMMENT_ISSUE_ACTION,
					text: {
						text: ModalsEnum.COMMENT_ISSUE_LABEL,
						type: TextObjectType.PLAINTEXT,
					},
					value: `${data?.repo} ${data?.issueNumber}`,
				}),
				block.newButtonElement({
					text: {
						text: AppEnum.DEFAULT_TITLE,
						type: TextObjectType.PLAINTEXT,
					},
					url: issueData?.html_url,
				}),
			],
		});

		block.addDividerBlock();

		if (issueComments?.length === 0) {
			block.addSectionBlock({
				text: {
					text: `📝 No comments so far !`,
					type: TextObjectType.MARKDOWN,
				},
			});
		}

		let index = 1;

		for (const comment of issueComments) {
			const username = comment?.user?.login;
			const commentBody = comment?.body;
			const userProfileUrl = comment?.user?.html_url;

			block.addSectionBlock({
				text: {
					text: `*@${username}*`,
					type: TextObjectType.MARKDOWN,
				},
				accessory: block.newButtonElement({
					actionId: ModalsEnum.VIEW_USER_ACTION,
					text: {
						text: ModalsEnum.VIEW_USER_LABEL,
						type: TextObjectType.PLAINTEXT,
					},
					url: userProfileUrl,
				}),
			});
			block.addSectionBlock({
				text: {
					text: `${commentBody}`,
					type: TextObjectType.MARKDOWN,
				},
			});
			const date = parseDate(comment?.created_at);
			const time = parseTime(comment?.created_at);
			block.addContextBlock({
				elements: [
					block.newPlainTextObject(
						`Created at : ${date} ${time} UTC`,
					),
				],
			});
			block.addDividerBlock();
			index = index + 1;
		}
	}

	return {
		id: viewId,
		title: {
			type: TextObjectType.PLAINTEXT,
			text: ModalsEnum.ISSUE_COMMENT_VIEW_TITLE,
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
