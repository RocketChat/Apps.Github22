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
import { parseDate, parseTime } from "../helpers/dateTime";
import { LayoutBlock } from "@rocket.chat/ui-kit";

export async function pullRequestCommentsModal({
    data,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
    id,
}: {
    data?;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
    id: string;
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = ModalsEnum.PULL_REQUEST_COMMENTS_MODAL_VIEW;

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
            text: ModalsEnum.PULL_REQUEST_COMMENT_VIEW_TITLE,
            type: "plain_text",
        },
        blocks: [],
        close: {
            type: "button",
            text: {
                type: "plain_text",
                emoji: true,
                text: "Close",
            },
            appId: id,
            actionId: '',
            blockId: '',
        },
    };

    let blocks: LayoutBlock[] = [];
    if (user?.id) {
        let roomId;
        if (room?.id) {
            roomId = room.id;
            await storeInteractionRoomData(persistence, user.id, roomId);
        } else {
            roomId = (await getInteractionRoomData(read.getPersistenceReader(), user.id)).roomId;
        }
        const pullData = data?.pullData;
        const pullRequestComments = data?.pullRequestComments;

        blocks.push({
            type: "section",
            text: {
                text: `*${pullData?.title}*`,
                type: TextObjectType.MARKDOWN,
            },
            accessory: {
                type: "button",
                actionId: ModalsEnum.VIEW_FILE_ACTION,
                text: {
                    text: ModalsEnum.VIEW_DIFFS_ACTION_LABEL,
                    type: TextObjectType.PLAINTEXT,
                },
                value: pullData?.diff_url,
                blockId: '',
                appId: id,
            },
        });

        blocks.push({
            type: "context",
            elements: [
                { type: "plain_text", text: `Author: ${pullData?.user?.login} | ` },
                { type: "plain_text", text: `State: ${pullData?.state} | ` },
                { type: "plain_text", text: `Mergeable: ${pullData?.mergeable} | ` },
                { type: "plain_text", text: `Total Comments: ${pullRequestComments?.length} |` },
            ],
        });

        blocks.push({
            type: "actions",
            elements: [
                {
                    type: "button",
                    actionId: ModalsEnum.COMMENT_PR_ACTION,
                    text: {
                        text: ModalsEnum.COMMENT_PR_LABEL,
                        type: TextObjectType.PLAINTEXT,
                    },
                    value: `${data?.repo} ${data?.pullNumber}`,
                    appId: id,
                    blockId: '',
                },
                {
                    type: "button",
                    text: {
                        text: AppEnum.DEFAULT_TITLE,
                        type: TextObjectType.PLAINTEXT,
                    },
                    url: pullData?.html_url,
                    appId: id,
                    blockId: '',
                    actionId: '',
                },
            ],
        });

        blocks.push({ type: "divider" });

        if (pullRequestComments?.length === 0) {
            blocks.push({
                type: "section",
                text: {
                    text: "📝 No comments so far!",
                    type: TextObjectType.MARKDOWN,
                },
            });
        } else {
            for (const comment of pullRequestComments) {
                const username = comment?.user?.login;
                const userProfileUrl = comment?.user?.html_url;
                const commentBody = comment?.body;
                const date = parseDate(comment?.created_at);
                const time = parseTime(comment?.created_at);

                blocks.push({
                    type: "section",
                    text: {
                        text: `*@${username}*`,
                        type: TextObjectType.MARKDOWN,
                    },
                    accessory: {
                        type: "button",
                        actionId: ModalsEnum.VIEW_USER_ACTION,
                        text: {
                            text: ModalsEnum.VIEW_USER_LABEL,
                            type: TextObjectType.PLAINTEXT,
                        },
                        url: userProfileUrl,
                        appId: id,
                        blockId: '',
                    },
                });

                blocks.push({
                    type: "section",
                    text: {
                        text: commentBody,
                        type: TextObjectType.MARKDOWN,
                    },
                });

                blocks.push({
                    type: "context",
                    elements: [
                        { type: "plain_text", text: `Created at: ${date} ${time} UTC` },
                    ],
                });

                blocks.push({ type: "divider" });
            }
        }
    }

    modal.blocks = blocks;
    return modal;
}
