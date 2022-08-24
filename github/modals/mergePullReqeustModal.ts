import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { TextObjectType } from "@rocket.chat/apps-engine/definition/uikit/blocks";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { ModalsEnum } from "../enum/Modals";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    UIKitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import {
    storeInteractionRoomData,
    getInteractionRoomData,
} from "../persistance/roomInteraction";

export async function mergePullRequestModal({
    data,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
}: {
    data?:any,
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.MERGE_PULL_REQUEST_VIEW;
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
        let defualtPullNumberInput = "";
        let defaultRepoInfoInput = "";
        if(data?.repo?.length){
            defaultRepoInfoInput = data?.repo as string;
        } 
        if(data?.pullNumber?.length){
            defualtPullNumberInput = data?.pullNumber as string;
        } 
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
                initialValue:defaultRepoInfoInput
            }),
        });

        block.addInputBlock({
            blockId: ModalsEnum.PULL_REQUEST_NUMBER_INPUT,
            label: {
                text: ModalsEnum.PULL_REQUEST_NUMBER_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: block.newPlainTextInputElement({
                actionId: ModalsEnum.PULL_REQUEST_NUMBER_INPUT_ACTION,
                placeholder: {
                    text: ModalsEnum.PULL_REQUEST_NUMBER_INPUT_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT,
                },
                initialValue:defualtPullNumberInput
            }),
        });

        block.addInputBlock({
            blockId: ModalsEnum.PULL_REQUEST_COMMIT_TITLE_INPUT,
            label: {
                text: ModalsEnum.PULL_REQUEST_COMMIT_TITLE_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: block.newPlainTextInputElement({
                actionId: ModalsEnum.PULL_REQUEST_COMMIT_TITLE_ACTION,
                placeholder: {
                    text: ModalsEnum.PULL_REQUEST_COMMIT_TITLE_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT,
                },
            }),
        });

        block.addInputBlock({
            blockId: ModalsEnum.PULL_REQUEST_COMMIT_MESSAGE_INPUT,
            label: {
                text: ModalsEnum.PULL_REQUEST_COMMIT_MESSAGE_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: block.newPlainTextInputElement({
                actionId: ModalsEnum.PULL_REQUEST_COMMIT_MESSAGE_ACTION,
                placeholder: {
                    text: ModalsEnum.PULL_REQUEST_COMMIT_MESSAGE_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT,
                },
                multiline:true
            }),
        });

        let newMultiStaticElemnt = block.newStaticSelectElement({
            actionId: ModalsEnum.PULL_REQUEST_MERGE_METHOD_OPTION,
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
                }
            ],
            placeholder: {
                type: TextObjectType.PLAINTEXT,
                text: "Select Events",
            },
        });

        block.addInputBlock({
            label: {
                text: ModalsEnum.PULL_REQUEST_MERGE_METHOD_INPUT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: newMultiStaticElemnt,
            blockId: ModalsEnum.PULL_REQUEST_MERGE_METHOD_INPUT,
        });
    }

    block.addDividerBlock();

    return {
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: ModalsEnum.MERGE_PULL_REQUEST_VIEW_TITLE,
        },
        close: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Close",
            },
        }),
        submit: block.newButtonElement({
            actionId: ModalsEnum.ADD_SUBSCRIPTION_ACTION,
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Merge",
            },
        }),
        blocks: block.getBlocks(),
    };
}
