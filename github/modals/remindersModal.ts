import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ButtonStyle,
    ITextObject,
    TextObjectType,
} from "@rocket.chat/apps-engine/definition/uikit/blocks";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { ModalsEnum } from "../enum/Modals";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    UIKitBlockInteractionContext,
    UIKitInteractionContext,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { getUserReminder } from "../persistance/remind";
import { IReminder } from "../definitions/Reminder";
import { LayoutBlock } from "@rocket.chat/ui-kit";

export async function reminderModal({
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
    const viewId = ModalsEnum.REMINDER_LIST_MODAL_VIEW;

    const room =
        slashcommandcontext?.getRoom() ||
        uikitcontext?.getInteractionData().room;
    const user =
        slashcommandcontext?.getSender() ||
        uikitcontext?.getInteractionData().user;

    const modal: IUIKitSurfaceViewParam = {
        type: UIKitSurfaceType.MODAL,
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: "Reminder List",
        },
        blocks: [],
        close: {
            type: "button",
            blockId: "",
            actionId: "",
            appId: id,
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Close",
            },
        },
    };

    let blocks: LayoutBlock[] = [];

    if (user?.id) {
        const reminders: IReminder = await getUserReminder(read, user);

        if (reminders && reminders.repos.length > 0) {
            for (let repository of reminders.repos) {
                blocks.push({
                    type: "section",
                    text: {
                        text: `${repository}`,
                        type: TextObjectType.PLAINTEXT,
                    },
                });

                blocks.push(
                    {
                        type: "actions",
                        elements: [
                            {
                                type: "button",
                                appId: id,
                                blockId: "",
                                actionId: ModalsEnum.OPEN_REPO_ACTION,
                                text: {
                                    type: "plain_text",
                                    text: "Open",
                                },
                                url: `https://github.com/${repository}`,
                                style: ButtonStyle.PRIMARY,
                            },
                            {
                                type: "button",
                                appId: id,
                                blockId: "",
                                actionId:
                                    ModalsEnum.REMINDER_REMOVE_REPO_ACTION,
                                text: {
                                    type: "plain_text",
                                    text: "Remove",
                                },
                                value: `${repository}`,
                                style: ButtonStyle.DANGER,
                            },
                        ],
                    },
                    { type: "divider" },
                );
            }
        } else {

            blocks.push({
                type: 'section',
                text: {
                    text: "You have no reminders.",
                    type: TextObjectType.PLAINTEXT,
                },
            })
        }
    }

    modal.blocks = blocks;
    return modal;
}
