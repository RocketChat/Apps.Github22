import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import { TextObjectType } from "@rocket.chat/apps-engine/definition/uikit/blocks";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { ModalsEnum } from "../enum/Modals";
import { AppEnum } from "../enum/App";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    UIKitBlockInteractionContext,
    UIKitInteractionContext,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import {
    storeInteractionRoomData,
    getInteractionRoomData,
} from "../persistance/roomInteraction";
import { Subscription } from "../persistance/subscriptions";
import { ISubscription } from "../definitions/subscription";
import { LayoutBlock } from "@rocket.chat/ui-kit";

export async function addIssueCommentsModal({
    data,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
    id,
}: {
    data?: any;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
    id: string;
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = ModalsEnum.ADD_ISSUE_COMMENT_VIEW;
    const room =
        slashcommandcontext?.getRoom() ||
        uikitcontext?.getInteractionData().room;
    const user =
        slashcommandcontext?.getSender() ||
        uikitcontext?.getInteractionData().user;

    const modal: IUIKitSurfaceViewParam = {
        id: viewId,
        type: UIKitSurfaceType.MODAL,
        title: {
            text: ModalsEnum.GITHUB_ISSUES_TITLE,
            type: "plain_text",
        },
        blocks: [],
        submit: {
            type: "button",
            text: {
                type: "plain_text",
                emoji: true,
                text: "Comment",
            },
            appId: id,
            blockId: '',
            actionId: '',
        },
        close: {
            type: "button",
            text: {
                type: "plain_text",
                emoji: true,
                text: "Close",
            },
            appId: id,
            blockId: '',
            actionId: '',
        },
    };

    let blocks: LayoutBlock[] = [];
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

        let repoName = "";
        let issueNumber = "";
        if (data?.repo?.length) {
            repoName = data?.repo;
        }
        if (data?.issueNumber?.length) {
            issueNumber = data?.issueNumber;
        }

        blocks.push({
            type: 'input',
            blockId: ModalsEnum.REPO_NAME_INPUT,
            label: {
                text: ModalsEnum.REPO_NAME_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: {
                type: 'plain_text_input',
                actionId: ModalsEnum.REPO_NAME_INPUT_ACTION,
                placeholder: {
                    text: ModalsEnum.REPO_NAME_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT
                },
                initialValue: repoName,
                blockId: ModalsEnum.REPO_NAME_INPUT,
                appId: id,
            }
        })
        blocks.push({
            type: 'input',
            blockId: ModalsEnum.ISSUE_NUMBER_INPUT,
            label: {
                text: ModalsEnum.ISSUE_NUMBER_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: {
                type: 'plain_text_input',
                actionId: ModalsEnum.ISSUE_NUMBER_INPUT_ACTION,
                placeholder: {
                    text: ModalsEnum.ISSUE_NUMBER_INPUT_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT
                },
                initialValue: issueNumber,
                blockId: ModalsEnum.ISSUE_NUMBER_INPUT,
                appId: id,
            }
        })
        blocks.push({
            type: 'input',
            label: {
                text: ModalsEnum.ISSUE_COMMENT_INPUT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: {
                type: 'plain_text_input',
                actionId: ModalsEnum.ISSUE_COMMENT_INPUT_ACTION,
                placeholder: {
                    text: ModalsEnum.ISSUE_COMMENT_INPUT_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT
                },
                multiline: true,
                appId: id,
                blockId: ModalsEnum.ISSUE_COMMENT_INPUT,
            }
        })
    }

    blocks.push({
        type: 'divider',
    })

    modal.blocks = blocks;
    return modal;
}
