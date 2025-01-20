import {
    IModify,
    IRead,
    IPersistence,
    IHttp,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    TextObjectType,
    UIKitInteractionContext,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { ModalsEnum } from "../enum/Modals";
import { getBasicUserInfo } from "../helpers/githubSDK";
import {
    storeInteractionRoomData,
    getInteractionRoomData,
} from "../persistance/roomInteraction";

export async function shareProfileModal({
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
    const viewId = ModalsEnum.SHARE_PROFILE_EXEC;

    const modal: IUIKitSurfaceViewParam = {
        id: viewId,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: "plain_text",
            text: "Share Profile",
        },
        blocks: [
            {
                type: "actions",
                elements: [
                    {
                        type: "multi_static_select",
                        actionId: ModalsEnum.SHARE_PROFILE_PARAMS,
                        blockId: "",
                        initialValue: [
                            "username",
                            "avatar",
                            "email",
                            "bio",
                            "followers",
                            "following",
                        ],
                        options: [
                            {
                                value: "followers",
                                text: {
                                    type: TextObjectType.PLAINTEXT,
                                    text: "Followers",
                                    emoji: true,
                                },
                            },
                            {
                                value: "following",
                                text: {
                                    type: TextObjectType.PLAINTEXT,
                                    text: "Following",
                                    emoji: true,
                                },
                            },
                            {
                                value: "avatar",
                                text: {
                                    text: "Avatar",
                                    type: TextObjectType.PLAINTEXT,
                                },
                            },
                            {
                                value: "username",
                                text: {
                                    text: "Github ID",
                                    type: TextObjectType.PLAINTEXT,
                                },
                            },
                            {
                                value: "email",
                                text: {
                                    type: TextObjectType.PLAINTEXT,
                                    text: "Email",
                                    emoji: true,
                                },
                            },
                            {
                                value: "bio",
                                text: {
                                    type: TextObjectType.PLAINTEXT,
                                    text: "bio",
                                },
                            },
                        ],
                        placeholder: {
                            type: TextObjectType.PLAINTEXT,
                            text: "Select Property to Share",
                        },
                        appId: id,
                    },
                ],
            },
        ],
        submit: {
            type: "button",
            appId: id,
            actionId: ModalsEnum.NEW_ISSUE_ACTION,
            blockId: "NEW_ISSUE_BLOCK",
            text: {
                type: "plain_text",
                text: "Share to Chat",
            },
            value: "shareChat",
        },
    };

    return modal;
}
