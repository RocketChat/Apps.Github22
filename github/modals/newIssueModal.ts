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

export async function NewIssueModal({
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
    const viewId = ModalsEnum.NEW_ISSUE_VIEW;
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

        block.addInputBlock({
            blockId: ModalsEnum.ISSUE_TITLE_INPUT,
            label: {
                text: ModalsEnum.ISSUE_TITLE_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: block.newPlainTextInputElement({
                actionId: ModalsEnum.ISSUE_TITLE_ACTION,
                placeholder: {
                    text: ModalsEnum.ISSUE_TITLE_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT,
                },
            }),
        });

        block.addInputBlock({
            blockId: ModalsEnum.ISSUE_BODY_INPUT,
            label: {
                text: ModalsEnum.ISSUE_BODY_INPUT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: block.newPlainTextInputElement({
                actionId: ModalsEnum.ISSUE_BODY_INPUT_ACTION,
                placeholder: {
                    text: ModalsEnum.ISSUE_BODY_INPUT_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT,
                },
                multiline: true
            }),
        });

        block.addInputBlock({
            blockId: ModalsEnum.ISSUE_LABELS_INPUT,
            label: {
                text: ModalsEnum.ISSUE_LABELS_INPUT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: block.newPlainTextInputElement({
                actionId: ModalsEnum.ISSUE_LABELS_INPUT_ACTION,
                placeholder: {
                    text: ModalsEnum.ISSUE_LABELS_INPUT_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT,
                },
            }),
        });

        block.addInputBlock({
            blockId: ModalsEnum.ISSUE_ASSIGNEES_INPUT,
            label: {
                text: ModalsEnum.ISSUE_ASSIGNEES_INPUT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: block.newPlainTextInputElement({
                actionId: ModalsEnum.ISSUE_ASSIGNEES_INPUT_ACTION,
                placeholder: {
                    text: ModalsEnum.ISSUE_ASSIGNEES_INPUT_PLACEHOLDER,
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
            text: ModalsEnum.NEW_ISSUE_TITLE,
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
                text: "Create Issue",
            },
        }),
        blocks: block.getBlocks(),
    };
}
