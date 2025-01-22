import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    ButtonStyle,
    TextObjectType,
    UIKitInteractionContext,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { ModalsEnum } from "../enum/Modals";
import { GitHubApi } from "../helpers/githubSDKclass";
import { UserInformation } from "../definitions/Userinfo";
import {
    getInteractionRoomData,
    storeInteractionRoomData,
} from "../persistance/roomInteraction";
import { AppSettingsEnum } from "../settings/settings";
import { LayoutBlock } from "@rocket.chat/ui-kit";

export async function userProfileModal({
    access_token,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
    id,
}: {
    access_token: String;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
    id: string;
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = ModalsEnum.USER_PROFILE_VIEW;
    const room =
        slashcommandcontext?.getRoom() ||
        uikitcontext?.getInteractionData().room;
    const user =
        slashcommandcontext?.getSender() ||
        uikitcontext?.getInteractionData().user;

    const modal: IUIKitSurfaceViewParam = {
        id: viewId,
        type: UIKitSurfaceType.MODAL,
        title: { text: "", type: "plain_text" },
        blocks: [],
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
    }
    let userInfo: UserInformation | undefined;
    try {
        let BaseHost = await read
            .getEnvironmentReader()
            .getSettings()
            .getValueById(AppSettingsEnum.BaseHostID);
        let BaseApiHost = await read
            .getEnvironmentReader()
            .getSettings()
            .getValueById(AppSettingsEnum.BaseApiHostID);
        const gitHubApiClient = new GitHubApi(
            http,
            access_token,
            BaseHost,
            BaseApiHost,
        );
        userInfo = await gitHubApiClient.getBasicUserInfo();

        modal.title.text = userInfo ? userInfo.name : "User Profile";
    } catch (error) {
        console.log("Error occurred while fetching user info:", error);
    }

    if (userInfo) {
        blocks.push({
            type: "context",
            elements: [
                {
                    type: "plain_text",
                    text: userInfo.email,
                },
            ],
        });
        blocks.push({
            type: "section",
            text: {
                type: "plain_text",
                text: userInfo.bio,
            },
            accessory: {
                type: "image",
                imageUrl: userInfo.avatar,
                altText: userInfo.name,
            },
        });

        blocks.push({
            type: "context",
            elements: [
                {
                    type: "plain_text",
                    text: `followers: ${userInfo?.followers}`,
                },
                {
                    type: "plain_text",
                    text: `following: ${userInfo?.following}`,
                },
            ],
        });

        blocks.push({ type: "divider" });

        blocks.push({
            type: "section",
            text: {
                type: "plain_text",
                text: "Select from the following options.",
            },
        });

        blocks.push({
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        text: "Share Profile",
                        type: TextObjectType.PLAINTEXT,
                    },
                    actionId: ModalsEnum.SHARE_PROFILE,
                    style: ButtonStyle.PRIMARY,
                    blockId: "",
                    appId: id,
                },
                {
                    type: "button",
                    text: {
                        text: "Issues",
                        type: TextObjectType.PLAINTEXT,
                    },
                    actionId: ModalsEnum.TRIGGER_ISSUES_MODAL,
                    style: ButtonStyle.PRIMARY,
                    blockId: "",
                    value: "Trigger Issues Modal",
                    appId: id,
                },
            ],
        });
        modal.blocks = blocks;
    }
    return modal;
}
