import {
    IHttp,
    IMessageBuilder,
    IModify,
    IModifyCreator,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

export async function helperMessage({
    room,
    read,
    persistence,
    modify,
    http,
}: {
    room: IRoom;
    read: IRead;
    persistence: IPersistence;
    modify: IModify;
    http: IHttp;
}) {
    let helperMessageString = `
    Github App Cheet Sheet
    
    1) See Interactive Button interface to fetch repository data -> /github GithubUsername/RepositoryName
    2) Get details of a Repository -> /github  GithubUsername/RepositoryName repo
    3) Get Issues of a Repository -> /github  GithubUsername/RepositoryName issues
    4) Get Comtributors of a Repository -> /github  GithubUsername/RepositoryName contributors
    5) Get Recent Pull Request of a Repository -> /github  GithubUsername/RepositoryName pulls

    `;

    const textSender = await modify
        .getCreator()
        .startMessage()
        .setText("```" + helperMessageString + "```");

    if (room) {
        textSender.setRoom(room);
    }
    await modify.getCreator().finish(textSender);
}
