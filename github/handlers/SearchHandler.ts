import { IRead, IPersistence, IHttp, IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { GithubApp } from "../GithubApp";
import { sendNotification } from "../lib/message";
import { githubSearchModal } from "../modals/githubSearchModal";
import { getAccessTokenForUser } from "../persistance/auth";

export async function handleSearch(
    read: IRead,
    context: SlashCommandContext,
    app: GithubApp,
    persistence: IPersistence,
    http: IHttp,
    room: IRoom,
    modify: IModify
){
    let accessToken = await getAccessTokenForUser(
        read,
        context.getSender(),
        app.oauth2Config
    );
    if (accessToken && accessToken.token) {
        const triggerId = context.getTriggerId();
        if (triggerId) {
            const modal = await githubSearchModal({
                modify: modify,
                read: read,
                persistence: persistence,
                http: http,
                slashcommandcontext: context,
            });
            await modify
                .getUiController()
                .openModalView(
                    modal,
                    { triggerId },
                    context.getSender()
                );
        } else {
            console.log("invalid Trigger ID !");
        }
    } else {
        await sendNotification(
            read,
            modify,
            context.getSender(),
            room,
            "Login to subscribe to repository events ! `/github login`"
        );
    }
}
