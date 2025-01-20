import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    TextObjectType,
} from "@rocket.chat/apps-engine/definition/uikit/blocks";
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

export async function NewIssueModal({
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
    const viewId = ModalsEnum.NEW_ISSUE_VIEW;
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
            type: "plain_text",
            text: ModalsEnum.NEW_ISSUE_TITLE,
        },
        blocks: [],
        submit: {
            type: "button",
            appId: id,
            actionId: ModalsEnum.NEW_ISSUE_ACTION,
            blockId: "NEW_ISSUE_BLOCK",
            text: {
                type: "plain_text",
                text: "Create Issue",
            },
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

        blocks.push({
            type: "input",
            label: {
                type: "plain_text",
                text: ModalsEnum.ISSUE_TITLE_LABEL,
            },
            element: {
                type: "plain_text_input",
                appId: id,
                actionId: ModalsEnum.ISSUE_TITLE_ACTION,
                blockId: ModalsEnum.ISSUE_TITLE_INPUT,
                placeholder: {
                    text: ModalsEnum.ISSUE_TITLE_PLACEHOLDER,
                    type: "plain_text",
                },
            },
        });

        if (data?.template != undefined) {
            blocks.push({
                type: "input",
                label: {
                    type: "plain_text",
                    text: ModalsEnum.ISSUE_TITLE_LABEL,
                },
                element: {
                    type: "plain_text_input",
                    appId: id,
                    actionId: ModalsEnum.ISSUE_TITLE_ACTION,
                    blockId: ModalsEnum.ISSUE_BODY_INPUT,
                    placeholder: {
                        text: ModalsEnum.ISSUE_BODY_INPUT_PLACEHOLDER,
                        type: "plain_text",
                    },
                    multiline: true,
                    initialValue: data?.template,
                },
            });
        } else {
            blocks.push({
                type: "input",
                label: {
                    type: "plain_text",
                    text: ModalsEnum.ISSUE_TITLE_LABEL,
                },
                element: {
                    type: "plain_text_input",
                    appId: id,
                    actionId: ModalsEnum.ISSUE_TITLE_ACTION,
                    blockId: ModalsEnum.ISSUE_BODY_INPUT,
                    placeholder: {
                        text: ModalsEnum.ISSUE_BODY_INPUT_PLACEHOLDER,
                        type: "plain_text",
                    },
                    multiline: true,
                },
            });
        }

        blocks.push({
            type: "input",
            label: {
                type: "plain_text",
                text: ModalsEnum.ISSUE_LABELS_INPUT_LABEL,
            },
            element: {
                type: "plain_text_input",
                appId: id,
                actionId: ModalsEnum.ISSUE_LABELS_INPUT_ACTION,
                blockId: ModalsEnum.ISSUE_LABELS_INPUT,
                placeholder: {
                    text: ModalsEnum.ISSUE_LABELS_INPUT_PLACEHOLDER,
                    type: "plain_text",
                },
            },
        });
        blocks.push({
            type: "input",
            label: {
                type: "plain_text",
                text: ModalsEnum.ISSUE_ASSIGNEES_INPUT_LABEL,
            },
            element: {
                type: "plain_text_input",
                appId: id,
                actionId: ModalsEnum.ISSUE_ASSIGNEES_INPUT_ACTION,
                blockId: ModalsEnum.ISSUE_ASSIGNEES_INPUT,
                placeholder: {
                    text: ModalsEnum.ISSUE_ASSIGNEES_INPUT_PLACEHOLDER,
                    type: "plain_text",
                },
            },
        });

        modal.blocks = blocks;
    }
    return modal;
}
