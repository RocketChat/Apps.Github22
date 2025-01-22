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
import { IGitHubSearchResultData } from "../definitions/searchResultData";
import {
    getInteractionRoomData,
    storeInteractionRoomData,
} from "../persistance/roomInteraction";
import { IGitHubIssueData } from "../definitions/githubIssueData";

export async function githubIssuesShareModal({
    data,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
    id,
}: {
    data: IGitHubIssueData;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
    id: string;
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = ModalsEnum.GITHUB_ISSUES_SHARE_VIEW;

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
            text: ModalsEnum.GITHUB_ISSUES_TITLE,
            type: "plain_text",
        },
        blocks: [],
        submit: {
            type: "button",
            text: {
                type: "plain_text",
                text: "Share",
            },
            appId: id,
            blockId: "submit_block",
            actionId: "submit_action",
        },
        close: {
            type: "button",
            text: {
                type: "plain_text",
                text: "Close",
            },
            appId: id,
            blockId: "close_block",
            actionId: "close_action",
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
        let finalString = `\n`;
        if (data.issue_list?.length) {
            for (let searchResult of data.issue_list) {
                if (searchResult.share) {
                    let searchResultString = `${searchResult.issue_compact}  `;
                    finalString = `${finalString} \n${searchResultString}`;
                }
            }
        }

        modal.blocks = [
            {
                type: "input",
                label: {
                    type: "plain_text",
                    text: ModalsEnum.MULTI_SHARE_GITHUB_ISSUES_INPUT_LABEL,
                },
                element: {
                    type: "plain_text_input",
                    appId: id,
                    actionId: ModalsEnum.MULTI_SHARE_GITHUB_ISSUES_INPUT_ACTION,
                    blockId: ModalsEnum.MULTI_SHARE_GITHUB_ISSUES_INPUT,
                    initialValue: `${finalString}`,
                    multiline: true,
                },
            },
            {
                type: "divider",
            },
        ];
    }

    return modal;
}
