import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { GithubApp } from "../GithubApp";
import { sendNotification } from "../lib/message";
import { authorize } from "../oath2/authentication";
import {
    getAccessTokenForUser,
    revokeUserAccessToken,
} from "../persistance/auth";

export async function handleLogin(
    app: GithubApp,
    read: IRead,
    modify: IModify,
    context: SlashCommandContext,
    room: IRoom,
    persistence: IPersistence
) {
    await authorize(app, read, modify, context.getSender(), room, persistence);
}

export async function handleLogout(
    app: GithubApp,
    read: IRead,
    modify: IModify,
    context: SlashCommandContext,
    room: IRoom,
    persistence: IPersistence,
    sender: IUser,
    http: IHttp
) {
    let accessToken = await getAccessTokenForUser(
        read,
        context.getSender(),
        app.oauth2Config
    );
    if (accessToken && accessToken?.token) {
        await revokeUserAccessToken(
            read,
            sender,
            persistence,
            http,
            app.oauth2Config
        );
        await sendNotification(
            read,
            modify,
            context.getSender(),
            room,
            "Logged out successfully !"
        );
    } else {
        await sendNotification(
            read,
            modify,
            context.getSender(),
            room,
            "You are not logged in !"
        );
    }
}
