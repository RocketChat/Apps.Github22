import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    AccessoryElements,
    ITextObject,
    TextObjectType,
} from "@rocket.chat/apps-engine/definition/uikit/blocks";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { ModalsEnum } from "../enum/Modals";
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
import { ButtonElement, LayoutBlock } from "@rocket.chat/ui-kit";
import { ContextBlockElements } from "@rocket.chat/ui-kit/dist/esm/blocks/layout/ContextBlock";

export async function githubIssuesListModal({
    data,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
    id,
}: {
    data: any;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
    id: string;
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = ModalsEnum.ISSUE_LIST_VIEW;

    const room =
        slashcommandcontext?.getRoom() ||
        uikitcontext?.getInteractionData().room;
    const user =
        slashcommandcontext?.getSender() ||
        uikitcontext?.getInteractionData().user ||
        (await read.getUserReader().getById(data?.user_id as string));

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
                text: "Share",
            },
            appId: id,
            blockId: "submit_block",
            actionId: "submit_action",
        },
        close: {
            type: "button",
            text: {
                type: "plain_text",
                text: "Close",
            },
            appId: id,
            blockId: "close_block",
            actionId: "close_action",
        },
    };

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

        const blocks: LayoutBlock[] = [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*${data.repo}*`,
                },
            },
            {
                type: "divider",
            },
        ];

        if (data.issues && Array.isArray(data.issues)) {
            let index = 1;
            for (const issue of data.issues) {
                blocks.push({
                    type: "section",
                    text: {
                        type: "plain_text",
                        text: `#${issue.number} ${issue.title}`,
                    },
                });

                const contextBlockElements: ContextBlockElements[] = [
                    {
                        type: "mrkdwn",
                        text: `User: ${issue.user_login} | Status: ${issue.state} | `,
                    },
                ];

                if (issue.labels && Array.isArray(issue.labels)) {
                    const labelString = issue.labels.join(" ");
                    if (labelString.length) {
                        contextBlockElements.push({
                            type: "mrkdwn",
                            text: `Labels: ${labelString} `,
                        });
                    }
                }

                blocks.push({
                    type: "context",
                    elements: contextBlockElements,
                });

                if (issue.assignees && Array.isArray(issue.assignees)) {
                    const assigneesString = issue.assignees.join(" ");
                    if (assigneesString.length) {
                        blocks.push({
                            type: "context",
                            elements: [
                                {
                                    type: "plain_text",
                                    text: `Assignees: ${assigneesString} `,
                                },
                            ],
                        });
                    }
                }

                const actionBlockElements: ButtonElement[] = [
                    {
                        type: "button",
                        appId: id,
                        blockId: ModalsEnum.OPEN_GITHUB_RESULT_LABEL,
                        actionId: ModalsEnum.OPEN_GITHUB_RESULT_ACTION,
                        text: {
                            type: "plain_text",
                            text: ModalsEnum.OPEN_GITHUB_RESULT_LABEL,
                        },
                        value: issue.html_url?.toString(),
                    },
                ];

                if (data.pushRights) {
                    actionBlockElements.push({
                        type: "button",
                        appId: id,
                        blockId: ModalsEnum.ADD_GITHUB_ISSUE_ASSIGNEE_LABEL,
                        actionId: ModalsEnum.ADD_GITHUB_ISSUE_ASSIGNEE,
                        text: {
                            type: "plain_text",
                            text: ModalsEnum.ADD_GITHUB_ISSUE_ASSIGNEE_LABEL,
                        },
                        value: `${data.repo} ${issue.number} ${issue.assignees?.join(" ") || ""}`,
                    });
                }

                if (issue.share) {
                    actionBlockElements.push({
                        type: "button",
                        appId: id,
                        actionId:
                            ModalsEnum.MULTI_SHARE_REMOVE_GITHUB_ISSUE_ACTION,
                        blockId:
                            ModalsEnum.MULTI_SHARE_REMOVE_GITHUB_ISSUE_LABEL,
                        text: {
                            type: "plain_text",
                            text: ModalsEnum.MULTI_SHARE_REMOVE_GITHUB_ISSUE_LABEL,
                        },
                        value: issue.issue_id,
                    });
                } else {
                    actionBlockElements.push({
                        type: "button",
                        appId: id,
                        actionId:
                            ModalsEnum.MULTI_SHARE_ADD_GITHUB_ISSUE_ACTION,
                        blockId: ModalsEnum.MULTI_SHARE_ADD_GITHUB_ISSUE_LABEL,
                        text: {
                            type: "plain_text",
                            text: ModalsEnum.MULTI_SHARE_ADD_GITHUB_ISSUE_LABEL,
                        },
                        value: issue.issue_id,
                    });
                }

                actionBlockElements.push({
                    type: "button",
                    appId: id,
                    blockId: ModalsEnum.ISSUE_COMMENT_LIST_LABEL,
                    actionId: ModalsEnum.ISSUE_COMMENT_LIST_ACTION,
                    text: {
                        type: "plain_text",
                        text: ModalsEnum.ISSUE_COMMENT_LIST_LABEL,
                    },
                    value: `${data.repo} ${issue.number}`,
                });

                blocks.push({
                    type: "actions",
                    elements: actionBlockElements,
                });

                blocks.push({
                    type: "divider",
                });

                index++;
            }
        }
        modal.blocks = blocks;
    }
    return modal;
}
