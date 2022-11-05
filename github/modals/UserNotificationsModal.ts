import { IModify, IRead, IPersistence, IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { TextObjectType, UIKitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { ModalsEnum } from "../enum/Modals";
import { getUserAssignedIssues } from "../helpers/githubSDK";
import { getInteractionRoomData, storeInteractionRoomData } from "../persistance/roomInteraction";

export async function userNotificationsModal ({
    access_token,
    modify,
    read,
    persistence,
    http,
    slashcommandcontext,
    uikitcontext
} : {
    access_token: String,
    modify : IModify,
    read: IRead,
    persistence: IPersistence,
    http: IHttp,
    slashcommandcontext: SlashCommandContext,
    uikitcontext?: UIKitInteractionContext
}) : Promise<IUIKitModalViewParam> {
    const viewId = ModalsEnum.USER_ISSUE_VIEW;
    const block = modify.getCreator().getBlockBuilder();
    const room = slashcommandcontext?.getRoom() || uikitcontext?.getInteractionData().room;
    const user = slashcommandcontext?.getSender() || uikitcontext?.getInteractionData().user;

    if (user?.id){
        let roomId;
        if (room?.id){
            roomId = room.id;
            await storeInteractionRoomData(persistence, user.id, roomId);
        }
        else {
            roomId = (await getInteractionRoomData(read.getPersistenceReader(), user.id)).roomId;
        }
    }

    // const repoInfo = await getUserAssignedIssues(http, access_token);

    return {
        id : viewId,
        title : {
            text : "Your Issues",
            type : TextObjectType.PLAINTEXT
        },
        blocks : block.getBlocks()
    }

}
