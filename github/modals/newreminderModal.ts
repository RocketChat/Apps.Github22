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

export async function NewReminderStarterModal({
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
    id: string,
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = ModalsEnum.NEW_REMINDER_VIEW;
    const room = slashcommandcontext?.getRoom() || uikitcontext?.getInteractionData().room;
    const user = slashcommandcontext?.getSender() || uikitcontext?.getInteractionData().user;

    const modal: IUIKitSurfaceViewParam = {
        type: UIKitSurfaceType.MODAL,
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: 'Create New reminder',
        },
        close: {
            type: 'button',
            blockId: '',
            appId: id,
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Close",
            },
            actionId: '',
        },
        submit: {
            type: 'button',
            blockId: '',
            appId: id,
            actionId: "new-reminder-action",
            text: {
                type: TextObjectType.PLAINTEXT,
                emoji:true,
                text: "Create",
            },
        },
        blocks:[],
    }

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
                    user.id
                )
            ).roomId;
        }

        blocks.push({
            type: 'input',
            blockId: ModalsEnum.REPO_NAME_INPUT,
            label: {
                text: ModalsEnum.REPO_NAME_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: {
                type: 'plain_text_input',
                actionId: ModalsEnum.REPO_NAME_INPUT_ACTION,
                placeholder: {
                    text: ModalsEnum.REPO_NAME_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT,
                },
                blockId: '',
                appId: id,
            },
        })
    }

    blocks.push({
        type: 'divider',
    })

    modal.blocks = blocks;
    return modal;
}
