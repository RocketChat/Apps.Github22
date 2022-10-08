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
import { IGitHubSearchResultData } from "../definitions/searchResultData";
import { getInteractionRoomData, storeInteractionRoomData } from "../persistance/roomInteraction";
import { IGitHubIssueData } from "../definitions/githubIssueData";

export async function githubIssuesShareModal({
    data,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext,
}: {
    data: IGitHubIssueData;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashcommandcontext?: SlashCommandContext;
    uikitcontext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.GITHUB_ISSUES_SHARE_VIEW;

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
        let finalString = `\n`;
        if(data.issue_list?.length){
            for(let searchResult of data.issue_list){
                if(searchResult.share){
                    let searchResultString = `${searchResult.issue_compact}  `;
                    finalString =`${finalString} \n${searchResultString}`;
                }
            }
        }
        
        block.addInputBlock({
            blockId: ModalsEnum.MULTI_SHARE_GITHUB_ISSUES_INPUT,
            label: { 
                text: ModalsEnum.MULTI_SHARE_GITHUB_ISSUES_INPUT_LABEL, 
                type: TextObjectType.MARKDOWN 
            },
            element: block.newPlainTextInputElement({
                initialValue : `${finalString}`,
                multiline:true,
                actionId: ModalsEnum.MULTI_SHARE_GITHUB_ISSUES_INPUT_ACTION,
            })
        });
    }

    block.addDividerBlock();
    return {
        id: viewId,
        title: {
            type: TextObjectType.PLAINTEXT,
            text: ModalsEnum.GITHUB_ISSUES_TITLE,
        },
        submit: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Send",
            },
        }),
        close: block.newButtonElement({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: "Close",
            },
        }),
        blocks: block.getBlocks(),
    };
}
