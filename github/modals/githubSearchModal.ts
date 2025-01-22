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
// import { getRoomTasks, getUIData, persistUIData } from '../lib/persistence';
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

export async function githubSearchModal({
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
    id,
}: {
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
    id: string;
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = ModalsEnum.SEARCH_VIEW;
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
            text: ModalsEnum.SEARCH_VIEW_TITLE,
            type: "plain_text",
        },
        blocks: [],
        submit: {
            type: "button",
            text: {
                type: "plain_text",
                emoji: true,
                text: "Search",
            },
            appId: id,
            blockId: "search_block",
            actionId: ModalsEnum.GITHUB_SEARCH_ACTION,
        },
        close: {
            type: "button",
            text: {
                type: "plain_text",
                emoji: true,
                text: "Close",
            },
            appId: id,
            blockId: "close_block",
            actionId: "close_action",
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

        // shows indentations in input blocks but not inn section block
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
                    type: "plain_text",
                    text: ModalsEnum.REPO_NAME_PLACEHOLDER,
                },
                multiline: false,
            },
        });

        blocks.push({
            type: "input",
            blockId: ModalsEnum.ADD_SEARCH_STATE_PARAMATER_INPUT,
            label: {
                text: ModalsEnum.ADD_SEARCH_STATE_PARAMATER_INPUT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: {
                type: "static_select",
                actionId: ModalsEnum.ADD_MAIN_SEARCH_PARAMATER_OPTION,
                blockId: "add-main-search-block",
                options: [
                    {
                        value: "issue",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "Issues",
                            emoji: true,
                        },
                    },
                    {
                        value: "pull_request",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "Pull Request",
                            emoji: true,
                        },
                    },
                    {
                        value: "issue/pull_request",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "Issues/Pull Request",
                            emoji: true,
                        },
                    },
                ],
                placeholder: {
                    type: TextObjectType.PLAINTEXT,
                    text: "Search Issues/Pull Request",
                },
                appId: id,
            },
        });

        blocks.push({
            type: "input",
            blockId: ModalsEnum.ADD_SEARCH_STATE_PARAMATER_INPUT,
            label: {
                text: ModalsEnum.ADD_SEARCH_STATE_PARAMATER_INPUT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: {
                type: "static_select",
                actionId: ModalsEnum.ADD_SEARCH_STATE_PARAMATER_INPUT_OPTION,
                blockId: ModalsEnum.ADD_SEARCH_STATE_PARAMATER_INPUT_LABEL,
                options: [
                    {
                        value: "open",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "Open",
                            emoji: true,
                        },
                    },
                    {
                        value: "closed",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "Closed",
                            emoji: true,
                        },
                    },
                    {
                        value: "any",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "Any",
                            emoji: true,
                        },
                    },
                ],
                placeholder: {
                    type: TextObjectType.PLAINTEXT,
                    text: "Open/Closed",
                },
                appId: id,
            },
        });

        blocks.push({
            type: "input",
            label: {
                type: "plain_text",
                text: ModalsEnum.AUTHOR_NAMES_INPUT_LABEL,
            },
            element: {
                type: "plain_text_input",
                appId: id,
                actionId: ModalsEnum.AUTHOR_NAMES_INPUT_ACTION,
                blockId: ModalsEnum.AUTHOR_NAMES_INPUT,
                placeholder: {
                    type: "plain_text",
                    text: ModalsEnum.AUTHOR_NAMES_INPUT_PLACEHOLDERS,
                },
            },
        });

        blocks.push({
            type: "input",
            label: {
                type: "plain_text",
                text: ModalsEnum.RESOURCE_LABELS_INPUT_LABEL,
            },
            element: {
                type: "plain_text_input",
                appId: id,
                actionId: ModalsEnum.RESOURCE_LABELS_INPUT_ACTION,
                blockId: ModalsEnum.RESOURCE_LABELS_INPUT,
                placeholder: {
                    type: "plain_text",
                    text: ModalsEnum.RESOURCE_LABELS_INPUT_PLACEHOLDER,
                },
            },
        });

        blocks.push({
            type: "input",
            label: {
                type: "plain_text",
                text: ModalsEnum.RESOURCE_MILESTONES_INPUT_LABEL,
            },
            element: {
                type: "plain_text_input",
                appId: id,
                actionId: ModalsEnum.RESOURCE_MILESTONES_INPUT_ACTION,
                blockId: ModalsEnum.RESOURCE_MILESTONES_INPUT,
                placeholder: {
                    type: "plain_text",
                    text: ModalsEnum.RESOURCE_MILESTONES_PLACEHOLDER,
                },
            },
        });
    }

    blocks.push({
        type: 'divider',
    })

    modal.blocks = blocks;
    return modal;
}
