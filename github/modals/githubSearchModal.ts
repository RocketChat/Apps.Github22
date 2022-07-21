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
// import { getRoomTasks, getUIData, persistUIData } from '../lib/persistence';
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    UIKitBlockInteractionContext,
    UIKitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import {
    storeInteractionRoomData,
    getInteractionRoomData,
} from "../persistance/roomInteraction";


export async function githubSearchModal({
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
}: {
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.SEARCH_VIEW;
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
                    user.id
                )
            ).roomId;
        }

        

        // shows indentations in input blocks but not inn section block
        block.addInputBlock({
            blockId: ModalsEnum.REPO_NAME_INPUT,
            label: {
                text: ModalsEnum.REPO_NAME_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: block.newPlainTextInputElement({
                actionId: ModalsEnum.REPO_NAME_INPUT_ACTION,
                placeholder: {
                    text: ModalsEnum.REPO_NAME_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT,
                },
            }),
        });

        let newResourceStaticElement = block.newStaticSelectElement({
            actionId: ModalsEnum.ADD_MAIN_SEARCH_PARAMATER_OPTION,
            options: [
                {
                    value: "issues",
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
            ],
            placeholder: {
                type: TextObjectType.PLAINTEXT,
                text: "Search Issues/Pull Request",
            },
        });

        block.addInputBlock({
            label: {
                text: ModalsEnum.ADD_MAIN_SEARCH_PARAMATER_INPUT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: newResourceStaticElement,
            blockId: ModalsEnum.ADD_MAIN_SEARCH_PARAMATER_INPUT,
        });
        
        let newResourceStateStaticElement = block.newStaticSelectElement({
            actionId: ModalsEnum.ADD_SEARCH_STATE_PARAMATER_INPUT_OPTION,
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
        });

        block.addInputBlock({
            label: {
                text: ModalsEnum.ADD_SEARCH_STATE_PARAMATER_INPUT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: newResourceStateStaticElement,
            blockId: ModalsEnum.ADD_SEARCH_STATE_PARAMATER_INPUT,
        });

        block.addInputBlock({
            blockId: ModalsEnum.AUTHOR_NAMES_INPUT,
            label: {
                text: ModalsEnum.AUTHOR_NAMES_INPUT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: block.newPlainTextInputElement({
                actionId: ModalsEnum.AUTHOR_NAMES_INPUT_ACTION,
                placeholder: {
                    text: ModalsEnum.AUTHOR_NAMES_INPUT_PLACEHOLDERS,
                    type: TextObjectType.PLAINTEXT,
                },
            }),
        });

        block.addInputBlock({
            blockId: ModalsEnum.RESOURCE_LABELS_INPUT,
            label: {
                text: ModalsEnum.RESOURCE_LABELS_INPUT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: block.newPlainTextInputElement({
                actionId: ModalsEnum.RESOURCE_LABELS_INPUT_ACTION,
                placeholder: {
                    text: ModalsEnum.RESOURCE_LABELS_INPUT_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT,
                },
            }),
        });

        block.addInputBlock({
            blockId: ModalsEnum.RESOURCE_MILESTONES_INPUT,
            label: {
                text: ModalsEnum.RESOURCE_MILESTONES_INPUT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: block.newPlainTextInputElement({
                actionId: ModalsEnum.RESOURCE_MILESTONES_INPUT_ACTION,
                placeholder: {
                    text: ModalsEnum.RESOURCE_MILESTONES_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT,
                },
            }),
        });
    }

    block.addDividerBlock();

    return {
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: ModalsEnum.SEARCH_VIEW_TITLE,
        },
        close: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Close",
            },
        }),
        submit: block.newButtonElement({
            actionId: ModalsEnum.GITHUB_SEARCH_ACTION,
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Search",
            },
        }),
        blocks: block.getBlocks(),
    };
}
