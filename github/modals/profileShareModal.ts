import {
	IModify,
	IRead,
	IPersistence,
	IHttp,
} from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import {
	TextObjectType,
	UIKitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { ModalsEnum } from '../enum/Modals';

export async function shareProfileModal({
	modify,
}: {
	modify: IModify;
	read: IRead;
	persistence: IPersistence;
	http: IHttp;
	slashcommandcontext?: SlashCommandContext;
	uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
	const viewId = 'ProfileShareView';
	const block = modify.getCreator().getBlockBuilder();

	block.addActionsBlock({
		elements: [
			block.newMultiStaticElement({
				actionId: ModalsEnum.SHARE_PROFILE_PARAMS,
				initialValue: [
					'username',
					'avatar',
					'email',
					'bio',
					'followers',
					'following',
					'contributionGraph',
				],
				options: [
					{
						value: 'followers',
						text: {
							type: TextObjectType.PLAINTEXT,
							text: 'Followers',
							emoji: true,
						},
					},
					{
						value: 'following',
						text: {
							type: TextObjectType.PLAINTEXT,
							text: 'Following',
							emoji: true,
						},
					},
					{
						value: 'avatar',
						text: {
							text: 'Avatar',
							type: TextObjectType.PLAINTEXT,
						},
					},
					{
						value: 'username',
						text: {
							text: 'Github ID',
							type: TextObjectType.PLAINTEXT,
						},
					},
					{
						value: 'email',
						text: {
							type: TextObjectType.PLAINTEXT,
							text: 'Email',
							emoji: true,
						},
					},
					{
						value: 'bio',
						text: {
							type: TextObjectType.PLAINTEXT,
							text: 'bio',
						},
					},
					{
						value: 'contributionGraph',
						text: {
							text: 'Contribution',
							type: TextObjectType.PLAINTEXT,
						},
					},
				],
				placeholder: {
					type: TextObjectType.PLAINTEXT,
					text: 'Select Property to Share',
				},
			}),
			block.newButtonElement({
				actionId: ModalsEnum.SHARE_PROFILE_EXEC,
				text: {
					text: 'Share to Chat',
					type: TextObjectType.PLAINTEXT,
				},
				value: 'shareChat',
			}),
		],
	});

	return {
		id: viewId,
		title: {
			type: TextObjectType.PLAINTEXT,
			text: 'Share Profile',
		},
		blocks: block.getBlocks(),
	};
}
