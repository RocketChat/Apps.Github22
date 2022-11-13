import {
    IRead,
    IPersistence,
    IHttp,
    IModify,
    IMessageBuilder
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { ButtonStyle, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { IGist } from "../definitions/Gist";
import { IGistFile } from "../definitions/GistFile";
import { OcticonIcons } from "../enum/OcticonIcons";
import { GithubApp } from "../GithubApp";
import { getBasicUserInfo, getUserGist, loadGist } from "../helpers/githubSDK";
import {
    sendMessage,
    sendNotification,
} from "../lib/message";
import { userGistModal } from "../modals/UserGistModal";
import { getAccessTokenForUser } from "../persistance/auth";

export async function handleGist(
    read: IRead,
    context: SlashCommandContext,
    app: GithubApp,
    persistence: IPersistence,
    http: IHttp,
    room: IRoom,
    modify: IModify
) {
    let access_token = await getAccessTokenForUser(
        read,
        context.getSender(),
        app.oauth2Config
    );
    const loggedIn = access_token && access_token.token;
    if (!loggedIn) {
        await sendNotification(
            read,
            modify,
            context.getSender(),
            room,
            "Login is Mandatory for getting User Info ! `/github login`"
        );
        return;
    }

    const triggerId = context.getTriggerId();
    if (triggerId) {
        const modal = await userGistModal({
            access_token: access_token!.token,
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
}

export async function sendGistWithNumber(
    gistNumber: number,
    read: IRead,
    context: SlashCommandContext,
    app: GithubApp,
    persistence: IPersistence,
    http: IHttp,
    room: IRoom,
    modify: IModify,
    gistFileNumber?: number
) {
    let access_token = await getAccessTokenForUser(
        read,
        context.getSender(),
        app.oauth2Config
    );
    const loggedIn = access_token && access_token.token;
    if (!loggedIn) {
        await sendNotification(
            read,
            modify,
            context.getSender(),
            room,
            "Login is Mandatory for getting User Info ! `/github login`"
        );
        return;
    }

    const userInfo = await getBasicUserInfo(http, access_token!.token);
    const userGist: IGist[] = await getUserGist(
        http,
        userInfo.username,
        access_token!.token
    );

    if (userGist.length < gistNumber || gistNumber <= 0) {
        await sendNotification(
            read,
            modify,
            context.getSender(),
            room,
            "Sorry, not enough gist available, kindly reconfirm the gist number."
        );

        return;
    }

    try {
        const block = modify.getCreator().getBlockBuilder();

        const targetGist = userGist[gistNumber - 1];

        const files = new Map<string, IGistFile>(
            Object.entries(targetGist.files)
        );

        block.addContextBlock({
            elements : [
                block.newImageElement({
                    imageUrl : targetGist['owner']['avatar_url'],
                    altText : "Created by"
                }),
                block.newPlainTextObject(targetGist['owner']['login']),
                block.newImageElement({
                    imageUrl : OcticonIcons.PENCIL,
                    altText : "Updated at",
                }),
                block.newPlainTextObject(new Date(targetGist.updated_at).toISOString())
            ]
        })

        for (const [_, value] of files) {
            const gistContent = await loadGist(
                http,
                value.raw_url,
                access_token!.token
            );

            block.addSectionBlock({
                text: {
                    text: `*${value.filename}*`,
                    type: TextObjectType.MARKDOWN,
                },
            });

            block.addSectionBlock({
                text: {
                    text: `\`\`\` ${value.language} \n ${gistContent} \n\`\`\``,
                    type: TextObjectType.MARKDOWN,
                },
            });
            block.addDividerBlock();
        }

        await sendMessage(modify, room, context.getSender(), "Gist", block);
    } catch (e) {
        console.log(e);
    }
    return;
}
