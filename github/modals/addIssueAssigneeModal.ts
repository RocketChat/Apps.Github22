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
import {
    storeInteractionRoomData,
    getInteractionRoomData,
} from "../persistance/roomInteraction";

export async function addIssueAssigneeModal({
    data,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
}: {
    data: any,
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.ADD_ISSUE_ASSIGNEE_VIEW;
    const block = modify.getCreator().getBlockBuilder();
    const room = slashcommandcontext?.getRoom() || uikitcontext?.getInteractionData().room;
    const user = slashcommandcontext?.getSender() || uikitcontext?.getInteractionData().user;

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

        if(data?.repository != undefined){
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
                    initialValue: data?.repository
                }),
            });
        }else{
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
        }

        if(data?.issueNumber){
            block.addInputBlock({
                blockId: ModalsEnum.ISSUE_NUMBER_INPUT,
                label: {
                    text: ModalsEnum.ISSUE_NUMBER_INPUT_LABEL,
                    type: TextObjectType.PLAINTEXT,
                },
                element: block.newPlainTextInputElement({
                    actionId: ModalsEnum.ISSUE_NUMBER_INPUT_ACTION,
                    placeholder: {
                        text: ModalsEnum.ISSUE_NUMBER_INPUT_PLACEHOLDER,
                        type: TextObjectType.PLAINTEXT,
                    },
                    initialValue: data.issueNumber
                }),
            });
        }else{
            block.addInputBlock({
                blockId: ModalsEnum.ISSUE_NUMBER_INPUT,
                label: {
                    text: ModalsEnum.ISSUE_NUMBER_INPUT_LABEL,
                    type: TextObjectType.PLAINTEXT,
                },
                element: block.newPlainTextInputElement({
                    actionId: ModalsEnum.ISSUE_NUMBER_INPUT_ACTION,
                    placeholder: {
                        text: ModalsEnum.ISSUE_NUMBER_INPUT_PLACEHOLDER,
                        type: TextObjectType.PLAINTEXT,
                    },
                }),
            });
        }

        if(data?.assignees){
            block.addInputBlock({
                blockId: ModalsEnum.ISSUE_ASSIGNEE_INPUT,
                label: {
                    text: ModalsEnum.ISSUE_ASSIGNEE_LABEL,
                    type: TextObjectType.PLAINTEXT,
                },
                element: block.newPlainTextInputElement({
                    actionId: ModalsEnum.ISSUE_ASSIGNEE_INPUT_ACTION,
                    placeholder: {
                        text: ModalsEnum.ISSUE_ASSIGNEE_PLACEHOLDER,
                        type: TextObjectType.PLAINTEXT,
                    },
                    initialValue: data.assignees
                }),
            });
        }else{
            block.addInputBlock({
                blockId: ModalsEnum.ISSUE_ASSIGNEE_INPUT,
                label: {
                    text: ModalsEnum.ISSUE_ASSIGNEE_LABEL,
                    type: TextObjectType.PLAINTEXT,
                },
                element: block.newPlainTextInputElement({
                    actionId: ModalsEnum.ISSUE_ASSIGNEE_INPUT_ACTION,
                    placeholder: {
                        text: ModalsEnum.ISSUE_ASSIGNEE_PLACEHOLDER,
                        type: TextObjectType.PLAINTEXT,
                    },
                }),
            });
        }
    }

    block.addDividerBlock();

    return {
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: ModalsEnum.GITHUB_ISSUES_TITLE,
        },
        close: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Close",
            },
        }),
        submit: block.newButtonElement({
            actionId: ModalsEnum.NEW_ISSUE_ACTION,
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Assign",
            },
        }),
        blocks: block.getBlocks(),
    };
}
