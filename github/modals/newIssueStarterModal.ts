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

export async function NewIssueStarterModal({
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
    const viewId = ModalsEnum.NEW_ISSUE_STARTER_VIEW;
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
            text:  ModalsEnum.NEW_ISSUE_TITLE,
            type: "plain_text",
        },
        blocks: [],
        submit: {
            type: "button",
            text: {
                type: "plain_text",
                emoji: true,
                text: "Next 🚀",
            },
            appId: id,
            blockId: "submit_block",
            actionId: ModalsEnum.NEW_ISSUE_STARTER__ACTION,
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

        modal.blocks = [
            {
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
            },
            {
                type: "divider",
            },
        ];
    }

    return modal;
}
