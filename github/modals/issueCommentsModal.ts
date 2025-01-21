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

export async function issueCommentsModal({
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
    const viewId = ModalsEnum.ISSUE_COMMENTS_MODAL_VIEW;

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
            text: ModalsEnum.ISSUE_COMMENT_VIEW_TITLE,
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
            blockId: "",
            actionId: "",
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
        let issueData = data?.issueData;
        let issueComments = data?.issueComments;

        blocks.push({
            type: "section",
            text: {
                text: `*${issueData?.title}*`,
                type: TextObjectType.MARKDOWN,
            },
        });

        blocks.push({
            type: "context",
            elements: [
                {
                    type: "plain_text",
                    text: `Author: ${issueData?.user_login} | `,
                },
                {
                    type: "plain_text",
                    text: `State : ${issueData?.state} | `,
                },
                {
                    type: "plain_text",
                    text: `Total Comments : ${issueComments?.length} |`,
                },
            ],
        });

        blocks.push(
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        appId: id,
                        actionId: ModalsEnum.COMMENT_ISSUE_ACTION,
                        text: {
                            text: ModalsEnum.COMMENT_ISSUE_LABEL,
                            type: TextObjectType.PLAINTEXT,
                        },
                        value: `${data?.repo} ${data?.issueNumber}`,
                        blockId: "",
                    },
                    {
                        type: "button",
                        appId: id,
                        actionId: "",
                        text: {
                            text: AppEnum.DEFAULT_TITLE,
                            type: TextObjectType.PLAINTEXT,
                        },
                        url: issueData?.html_url,
                        blockId: "",
                    },
                ],
            },
            { type: "divider" },
        );

        if (issueComments?.length === 0) {

            blocks.push({
                type: 'section',
                text: {
                    text: `📝 No comments so far !`,
                    type: TextObjectType.MARKDOWN,
                }
            })
        }

        let index = 1;

        for (let comment of issueComments) {
            let username = comment?.user?.login;
            let avatarUrl = comment?.user?.avatar_url;
            let commentBody = comment?.body;
            let userProfileUrl = comment?.user?.html_url;

            blocks.push({
                type: 'section',
                text: {
                    text: `*@${username}*`,
                    type: TextObjectType.MARKDOWN,
                },
                accessory: {
                    type: 'button',
                    actionId: ModalsEnum.VIEW_USER_ACTION,
                    text: {
                        text: ModalsEnum.VIEW_USER_LABEL,
                        type: TextObjectType.PLAINTEXT
                    },
                    blockId: '',
                    url: userProfileUrl,
                    appId: id,
                }
            })

            blocks.push({
                type: 'section',
                text: {
                    text: `${commentBody}`,
                    type: TextObjectType.MARKDOWN,
                }
            })
            let date = parseDate(comment?.created_at);
            let time = parseTime(comment?.created_at);

            blocks.push({
                type: 'context',
                elements: [
                    {
                        type: 'plain_text',
                        text: `Created at : ${date} ${time} UTC`,
                    }
                ]
            }, {type: 'divider'})
            index++;
        }
    }

    modal.blocks = blocks;
    return modal;
}
