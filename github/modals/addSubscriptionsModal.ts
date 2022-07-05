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
import { Subscription } from "../persistance/subscriptions";
import { ISubscription } from "../definitions/subscription";

export async function AddSubscriptionModal({
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
    const viewId = ModalsEnum.ADD_SUBSCRIPTION_VIEW;
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

        let subsciptionStorage = new Subscription(
            persistence,
            read.getPersistenceReader()
        );
        let roomSubsciptions: Array<ISubscription> =
            await subsciptionStorage.getSubscriptions(roomId);

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

        let newMultiStaticElemnt = block.newMultiStaticElement({
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
        });

        block.addInputBlock({
            label: {
                text: ModalsEnum.ADD_SUBSCRIPTION_EVENT_LABEL,
                type: TextObjectType.PLAINTEXT,
            },
            element: newMultiStaticElemnt,
            blockId: ModalsEnum.ADD_SUBSCRIPTION_EVENT_INPUT,
        });
    }

    block.addDividerBlock();

    return {
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: AppEnum.DEFAULT_TITLE,
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
                text: "Subscribe",
            },
        }),
        blocks: block.getBlocks(),
    };
}
