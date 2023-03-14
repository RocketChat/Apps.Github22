import { IRead, IPersistence, IHttp, IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { UIKitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { UserActivityContextualBar } from "../ContextualBars/UserActivityContextualBar";
import { GithubApp } from "../GithubApp";
import { getAccessTokenForUser } from "../persistance/auth";


export async function UserActivityHandler(
    read: IRead,
    context: SlashCommandContext,
    app: GithubApp,
    persistence: IPersistence,
    http: IHttp,
    room: IRoom,
    modify: IModify,
    uikitcontext?: UIKitInteractionContext
){

    let access_token = await getAccessTokenForUser(
        read,
        context.getSender(),
        app.oauth2Config
    );

    if (access_token != undefined && access_token.token != undefined) {
        const triggerID = context.getTriggerId() as string;
        const user = context.getSender();
        const block = await UserActivityContextualBar(access_token.token, modify, http, 1 )
        await modify.getUiController().openContextualBarView(
            block,
            { triggerId: triggerID },
            user
        );
    }

}
