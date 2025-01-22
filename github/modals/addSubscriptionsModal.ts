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
import { Subscription } from "../persistance/subscriptions";
import { ISubscription } from "../definitions/subscription";
import { LayoutBlock } from "@rocket.chat/ui-kit";

export async function AddSubscriptionModal({
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
    const viewId = ModalsEnum.ADD_SUBSCRIPTION_VIEW;
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
            text: ModalsEnum.ADD_SUBSCIPTIONS_TITLE,
        },
        blocks: [],
        close: {
            type: "button",
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Close",
            },
            actionId: "",
            blockId: "",
            appId: id,
        },
        submit: {
            type: "button",
            actionId: ModalsEnum.ADD_SUBSCRIPTION_ACTION,
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Subscribe",
            },
            blockId: "",
            appId: id,
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

        let subscriptionStorage = new Subscription(
            persistence,
            read.getPersistenceReader(),
        );
        let roomSubscriptions: Array<ISubscription> =
            await subscriptionStorage.getSubscriptions(roomId);

        // shows indentations in input blocks but not inn section block
        //
        blocks.push({
            type: "input",
            label: {
                text: ModalsEnum.REPO_NAME_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: {
                type: "plain_text_input",
                actionId: ModalsEnum.REPO_NAME_INPUT_ACTION,
                placeholder: {
                    text: ModalsEnum.REPO_NAME_PLACEHOLDER,
                    type: TextObjectType.PLAINTEXT,
                },
                appId: id,
                blockId: ModalsEnum.REPO_NAME_INPUT,
            },
        });

        let newMultiStaticElemnt = {
            type: "multi_static_select",
            actionId: ModalsEnum.ADD_SUBSCRIPTION_EVENT_OPTIONS,
            options: [
                {
                    value: "issues",
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "New Issues",
                        emoji: true,
                    },
                },
                {
                    value: "pull_request",
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "New Pull Request",
                        emoji: true,
                    },
                },
                {
                    value: "push",
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "New Commits",
                        emoji: true,
                    },
                },
                {
                    value: "deployment_status",
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "Deployment",
                        emoji: true,
                    },
                },
                {
                    value: "star",
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "New Stars",
                        emoji: true,
                    },
                },
            ],
            placeholder: {
                type: TextObjectType.PLAINTEXT,
                text: "Select Events",
            },
        };

        blocks.push({
            type: "input",
            label: {
                text: ModalsEnum.ADD_SUBSCRIPTION_EVENT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: {
                type: "multi_static_select",
                actionId: ModalsEnum.ADD_SUBSCRIPTION_EVENT_OPTIONS,
                blockId: "",
                options: [
                    {
                        value: "issues",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "New Issues",
                            emoji: true,
                        },
                    },
                    {
                        value: "pull_request",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "New Pull Request",
                            emoji: true,
                        },
                    },
                    {
                        value: "push",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "New Commits",
                            emoji: true,
                        },
                    },
                    {
                        value: "deployment_status",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "Deployment",
                            emoji: true,
                        },
                    },
                    {
                        value: "star",
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: "New Stars",
                            emoji: true,
                        },
                    },
                ],
                placeholder: {
                    type: TextObjectType.PLAINTEXT,
                    text: "Select Events",
                },
                appId: id,
            },
        });
    }
    blocks.push({
        type: 'divider',
    })
    modal.blocks = blocks;

    return modal;
}
