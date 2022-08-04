import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
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
} from "@rocket.chat/apps-engine/definition/uikit";
import { storeInteractionRoomData, getInteractionRoomData } from "../persistance/roomInteraction";
import { parseDate, parseTime } from "../helpers/dateTime";

export async function pullRequestCommentsModal({
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
    const viewId = ModalsEnum.PULL_REQUEST_COMMENTS_MODAL_VIEW;

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
            roomId = (await getInteractionRoomData(read.getPersistenceReader(), user.id)).roomId;
        }
        let pullData = data?.pullData;
        let pullRequestComments = data?.pullRequestComments;

        block.addSectionBlock({
            text: {
                text: `#${pullData?.title}`,
                type: TextObjectType.PLAINTEXT,
            },
            accessory: block.newButtonElement({
                actionId: ModalsEnum.VIEW_FILE_ACTION,
                text: {
                    text: ModalsEnum.VIEW_DIFFS_ACTION_LABEL,
                    type: TextObjectType.PLAINTEXT,
                },
                value: pullData?.diff_url,
            }),
        });
        block.addContextBlock({
            elements: [
                block.newPlainTextObject(`Author: ${pullData?.user?.login} | `),
                block.newPlainTextObject(`State : ${pullData?.state} | `),
                block.newPlainTextObject(`Mergeable : ${pullData?.mergeable} |` ),
                block.newPlainTextObject(`Total Comments : ${pullRequestComments?.length} |` ),
            ],
        });
        
        block.addActionsBlock({
            elements: [
                block.newButtonElement({
                    actionId: ModalsEnum.COMMENT_PR_ACTION,
                    text: {
                        text: ModalsEnum.COMMENT_PR_LABEL,
                        type: TextObjectType.PLAINTEXT,
                    },
                    value: `${data?.repo} ${data?.pullNumber}`,
                }),
                block.newButtonElement({
                    text: {
                        text: AppEnum.DEFAULT_TITLE,
                        type: TextObjectType.PLAINTEXT,
                    },
                    url: pullData ?.html_url
                }),
            ],
        });

        block.addDividerBlock();

        if(pullRequestComments?.length === 0){
            block.addSectionBlock({
                text: {
                    text: `📝 No comments so far !`,
                    type: TextObjectType.MARKDOWN,
                },
            });
        }

        let index = 1;

        for (let comment of pullRequestComments) {
            let username = comment?.user?.login;
            let avatarUrl = comment?.user?.avatar_url;
            let commentBody = comment?.body;
            let userProfileUrl = comment?.user?.html_url

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
                    url:userProfileUrl
                }),
            });
            block.addSectionBlock({
                text: {
                    text: `${commentBody}`,
                    type: TextObjectType.MARKDOWN,
                },
            });
            let date = parseDate(comment?.created_at);
            let time = parseTime(comment?.created_at);
            block.addContextBlock({
                elements: [
                    block.newPlainTextObject(`Created at : ${date} ${time} UTC`),
                ],
            });
            block.addDividerBlock();
            index++;
        }
    }

    return {
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: ModalsEnum.PULL_REQUEST_COMMENT_VIEW_TITLE,
        },
        close: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Close",
            },
        }),
        blocks: block.getBlocks(),
    };
}
