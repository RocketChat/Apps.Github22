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
import { LayoutBlock } from "@rocket.chat/ui-kit";

export async function addIssueAssigneeModal({
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
    const viewId = ModalsEnum.ADD_ISSUE_ASSIGNEE_VIEW;
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
                text: "Assign",
            },
            appId: id,
            blockId: "submit_block",
            actionId: ModalsEnum.NEW_ISSUE_ACTION,
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

        let blocks: LayoutBlock[] = [];

        if (data?.repository != undefined) {
            blocks.push({
                type: "input",
                label: {
                    type: "plain_text",
                    text: ModalsEnum.REPO_NAME_LABEL,
                },
                element: {
                    type: "plain_text_input",
                    appId: id,
                    actionId: ModalsEnum.REPO_NAME_INPUT_ACTION,
                    placeholder: {
                        text: ModalsEnum.REPO_NAME_PLACEHOLDER,
                        type: "plain_text",
                    },
                    blockId: ModalsEnum.REPO_NAME_INPUT,
                    initialValue: data?.repository,
                },
            });
        } else {
            blocks.push({
                type: "input",
                label: {
                    type: "plain_text",
                    text: ModalsEnum.REPO_NAME_LABEL,
                },
                element: {
                    type: "plain_text_input",
                    appId: id,
                    actionId: ModalsEnum.REPO_NAME_INPUT_ACTION,
                    blockId: ModalsEnum.REPO_NAME_INPUT,
                    placeholder: {
                        text: ModalsEnum.REPO_NAME_PLACEHOLDER,
                        type: "plain_text",
                    },
                },
            });
        }

        if (data?.issueNumber) {
            blocks.push({
                type: "input",
                label: {
                    type: "plain_text",
                    text: ModalsEnum.ISSUE_NUMBER_INPUT_LABEL,
                },
                element: {
                    type: "plain_text_input",
                    appId: id,
                    actionId: ModalsEnum.ISSUE_NUMBER_INPUT_ACTION,
                    blockId: ModalsEnum.ISSUE_NUMBER_INPUT,
                    placeholder: {
                        text: ModalsEnum.ISSUE_NUMBER_INPUT_PLACEHOLDER,
                        type: "plain_text",
                    },
                    initialValue: data.issueNumber,
                },
            });
        } else {
            blocks.push({
                type: "input",
                label: {
                    type: "plain_text",
                    text: ModalsEnum.ISSUE_NUMBER_INPUT_LABEL,
                },
                element: {
                    type: "plain_text_input",
                    appId: id,
                    actionId: ModalsEnum.ISSUE_NUMBER_INPUT_ACTION,
                    blockId: ModalsEnum.ISSUE_NUMBER_INPUT,
                    placeholder: {
                        text: ModalsEnum.ISSUE_NUMBER_INPUT_PLACEHOLDER,
                        type: "plain_text",
                    },
                },
            });
        }

        if (data?.assignees) {
            blocks.push({
                type: "input",
                label: {
                    type: "plain_text",
                    text: ModalsEnum.ISSUE_ASSIGNEE_LABEL,
                },
                element: {
                    type: "plain_text_input",
                    appId: id,
                    actionId: ModalsEnum.ISSUE_ASSIGNEE_INPUT_ACTION,
                    blockId: ModalsEnum.ISSUE_ASSIGNEE_INPUT,
                    placeholder: {
                        text: ModalsEnum.ISSUE_ASSIGNEE_PLACEHOLDER,
                        type: "plain_text",
                    },
                    initialValue: data.assignees,
                },
            });
        } else {
            blocks.push({
                type: "input",
                label: {
                    type: "plain_text",
                    text: ModalsEnum.ISSUE_ASSIGNEE_LABEL,
                },
                element: {
                    type: "plain_text_input",
                    appId: id,
                    actionId: ModalsEnum.ISSUE_ASSIGNEE_INPUT_ACTION,
                    blockId: ModalsEnum.ISSUE_ASSIGNEE_INPUT,
                    placeholder: {
                        text: ModalsEnum.ISSUE_ASSIGNEE_PLACEHOLDER,
                        type: "plain_text",
                    },
                },
            });
        }
        blocks.push({
            type: 'divider',
        })

        modal.blocks = blocks;
    }

    return modal;
}
