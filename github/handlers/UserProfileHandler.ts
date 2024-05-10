import {
    IRead,
    IPersistence,
    IHttp,
    IModify,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { UIKitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { GithubApp } from "../GithubApp";
import { sendNotification } from "../lib/message";
import { userProfileModal } from "../modals/UserProfileModal";
import { getAccessTokenForUser } from "../persistance/auth";

export async function handleUserProfileRequest(
    read: IRead,
    context: SlashCommandContext,
    app: GithubApp,
    persistence: IPersistence,
    http: IHttp,
    room: IRoom,
    modify: IModify,
    uikitcontext?: UIKitInteractionContext
) {
    let access_token = await getAccessTokenForUser(
        read,
        context.getSender(),
        app.oauth2Config
    );
    if (access_token?.token) {
        const triggerId = context.getTriggerId();
        if (triggerId) {
            const modal = await userProfileModal({
                app: app,
                modify: modify,
                read: read,
                persistence: persistence,
                http: http,
                slashcommandcontext: context,
            });
            await modify
                .getUiController()
                .openModalView(modal, { triggerId }, context.getSender());
        }
    } else {
        await sendNotification(
            read,
            modify,
            context.getSender(),
            room,
            "Login is Mandatory for getting User Info ! `/github login`"
        );
    }
}
