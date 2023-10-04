import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { GithubApp } from "../GithubApp";
import { HandleInvalidRepoName } from "./HandleInvalidRepoName";
import { CreateReminder } from "../persistance/remind";
import { sendNotification } from "../lib/message";

export async function createReminder(
    repository: string,
    room: IRoom,
    read: IRead,
    app: GithubApp,
    persistence: IPersistence,
    modify: IModify,
    http: IHttp,
    user: IUser
) {

    const repoName = repository;

    const isValidRepo = await HandleInvalidRepoName(
        repoName,
        http,
        app,
        modify,
        user,
        read,
        room
    )

    if (!isValidRepo) {
        return;
    } else {
        CreateReminder(read, persistence, user, repoName);
    }
    
    sendNotification(read, modify, user, room, `Pull Request Reminder Set for [${repoName}](https://github.com/${repoName}) 👍`)
}
