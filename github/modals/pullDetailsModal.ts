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

export async function pullDetailsModal({
	data,
	modify,
	read,
	persistence,
	http,
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
	const viewId = ModalsEnum.PULL_VIEW;

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

		const pullRawData = await http.get(
			`https://api.github.com/repos/${data?.repository}/pulls/${data?.number}`,
		);
		const pullData = pullRawData.data;

		const pullRequestFilesRaw = await http.get(
			`https://api.github.com/repos/${data?.repository}/pulls/${data?.number}/files`,
		);

		const pullRequestFiles = pullRequestFilesRaw.data;

		block.addSectionBlock({
			text: {
				text: `*${pullData?.title}*`,
				type: TextObjectType.MARKDOWN,
			},
			accessory: block.newButtonElement({
				actionId: ModalsEnum.VIEW_FILE_ACTION,
				text: {
					text: ModalsEnum.VIEW_DIFFS_ACTION_LABEL,
					type: TextObjectType.PLAINTEXT,
				},
				value: pullData['diff_url'],
			}),
		});
		block.addContextBlock({
			elements: [
				block.newPlainTextObject(`Author: ${pullData?.user?.login} | `),
				block.newPlainTextObject(`State : ${pullData?.state} | `),
				block.newPlainTextObject(`Mergeable : ${pullData?.mergeable}`),
			],
		});

		block.addDividerBlock();

		let index = 1;

		for (const file of pullRequestFiles) {
			const fileName = file['filename'];
			const rawUrl = file['raw_url'];
			const status = file['status'];
			const addition = file['additions'];
			const deletions = file['deletions'];
			block.addSectionBlock({
				text: {
					text: `${index} ${fileName}`,
					type: TextObjectType.PLAINTEXT,
				},
				accessory: block.newButtonElement({
					actionId: ModalsEnum.VIEW_FILE_ACTION,
					text: {
						text: ModalsEnum.VIEW_FILE_ACTION_LABEL,
						type: TextObjectType.PLAINTEXT,
					},
					value: rawUrl,
				}),
			});
			block.addContextBlock({
				elements: [
					block.newPlainTextObject(`Status: ${status} | `),
					block.newPlainTextObject(`Additions : ${addition} | `),
					block.newPlainTextObject(`Deletions : ${deletions}`),
				],
			});

			index++;
		}
	}

	block.addActionsBlock({
		elements: [
			block.newButtonElement({
				actionId: ModalsEnum.MERGE_PULL_REQUEST_ACTION,
				text: {
					text: ModalsEnum.MERGE_PULL_REQUEST_LABEL,
					type: TextObjectType.PLAINTEXT,
				},
				value: `${data?.repository} ${data?.number}`,
			}),
			block.newButtonElement({
				actionId: ModalsEnum.PR_COMMENT_LIST_ACTION,
				text: {
					text: ModalsEnum.PR_COMMENT_LIST_LABEL,
					type: TextObjectType.PLAINTEXT,
				},
				value: `${data?.repository} ${data?.number}`,
			}),
		],
	});

	return {
		id: viewId,
		title: {
			type: TextObjectType.PLAINTEXT,
			text: AppEnum.DEFAULT_TITLE,
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
