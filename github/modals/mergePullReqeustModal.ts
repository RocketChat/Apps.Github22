import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import { TextObjectType } from "@rocket.chat/apps-engine/definition/uikit/blocks";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { ModalsEnum } from "../enum/Modals";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    UIKitInteractionContext,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import {
    storeInteractionRoomData,
    getInteractionRoomData,
} from "../persistance/roomInteraction";
import { LayoutBlock } from "@rocket.chat/ui-kit";

export async function mergePullRequestModal({
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
    const viewId = ModalsEnum.MERGE_PULL_REQUEST_VIEW;
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
            text: ModalsEnum.MERGE_PULL_REQUEST_VIEW_TITLE,
            type: "plain_text",
        },
        blocks: [],
        submit: {
            type: "button",
            text: {
                type: "plain_text",
                text: "Merge",
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
        let defualtPullNumberInput = "";
        let defaultRepoInfoInput = "";
        if (data?.repo?.length) {
            defaultRepoInfoInput = data?.repo as string;
        }
        if (data?.pullNumber?.length) {
            defualtPullNumberInput = data?.pullNumber as string;
        }

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
                initialValue: defaultRepoInfoInput,
            },
        });

        blocks.push({
            type: "input",
            label: {
                type: "plain_text",
                text: ModalsEnum.PULL_REQUEST_NUMBER_LABEL,
            },
            element: {
                type: "plain_text_input",
                appId: id,
                actionId: ModalsEnum.PULL_REQUEST_NUMBER_INPUT_ACTION,
                blockId: ModalsEnum.PULL_REQUEST_NUMBER_INPUT,
                placeholder: {
                    type: "plain_text",
                    text: ModalsEnum.PULL_REQUEST_NUMBER_INPUT_PLACEHOLDER,
                },
                multiline: false,
                initialValue: defualtPullNumberInput,
            },
        });
        blocks.push({
            type: "input",
            label: {
                type: "plain_text",
                text: ModalsEnum.PULL_REQUEST_COMMIT_TITLE_LABEL,
            },
            element: {
                type: "plain_text_input",
                appId: id,
                actionId: ModalsEnum.PULL_REQUEST_COMMIT_TITLE_ACTION,
                blockId: ModalsEnum.PULL_REQUEST_COMMIT_TITLE_INPUT,
                placeholder: {
                    type: "plain_text",
                    text: ModalsEnum.PULL_REQUEST_COMMIT_TITLE_PLACEHOLDER,
                },
                multiline: false,
            },
        });
        blocks.push({
            type: "input",
            label: {
                type: "plain_text",
                text: ModalsEnum.PULL_REQUEST_COMMIT_MESSAGE_LABEL,
            },
            element: {
                type: "plain_text_input",
                appId: id,
                actionId: ModalsEnum.PULL_REQUEST_COMMIT_MESSAGE_ACTION,
                blockId: ModalsEnum.PULL_REQUEST_COMMIT_MESSAGE_INPUT,
                placeholder: {
                    type: "plain_text",
                    text: ModalsEnum.PULL_REQUEST_COMMIT_MESSAGE_PLACEHOLDER,
                },
                multiline: true,
            },
        });

        let newMultiStaticElemnt: any = [];

        newMultiStaticElemnt.push();

        blocks.push({
            type: "input",
            label: {
                text: ModalsEnum.PULL_REQUEST_MERGE_METHOD_INPUT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: {
                type: "static_select",
                actionId: ModalsEnum.PULL_REQUEST_MERGE_METHOD_OPTION,
                initialOption: {
                    value: "merge",
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "Merge",
                        emoji: true,
                    },
                },
                options: [
                    {
                        value: "rebase",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "Rebase",
                            emoji: true,
                        },
                    },
                    {
                        value: "merge",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "Merge",
                            emoji: true,
                        },
                    },
                    {
                        value: "squash",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "Squash",
                            emoji: true,
                        },
                    },
                ],
                placeholder: {
                    type: TextObjectType.PLAINTEXT,
                    text: "Select Events",
                },
                blockId: ModalsEnum.PULL_REQUEST_MERGE_METHOD_INPUT,
                appId: id,
            },
        });
    }

    modal.blocks = blocks;

    return modal;
}
