import {
    IHttp,
    IModify,
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
    Github App
    - Both /gh and /github commands can be used.
    1) See Interactive Button interface to fetch repository data -> /github Username/RepositoryName
    2) Get details of a Repository -> /github  Username/RepositoryName repo
    3) Get Issues of a Repository -> /github  Username/RepositoryName issues
    4) Get Contributors of a Repository -> /github  Username/RepositoryName contributors
    5) Get Recent Pull Request of a Repository -> /github  Username/RepositoryName pulls
    6) Review a Pull Request -> /github  Username/RepositoryName pulls pullNumber
    7) Login to GitHub -> /github login
    8) Logout from GitHub -> /github logout
    9) View/Add/Delete/Update Repository Subscriptions -> /github subscribe
    10) Subscribe to all repository events -> /github Username/RepositoryName subscribe
    11) Unsubscribe to all repository events -> /github Username/RepositoryName unsubscribe
    12) Add New Issues to GitHub Repository -> /github issue
    13) Search Issues and Pull Requests -> /github search
    14) Assign and Share Issues -> /github issues
    15) Review and Share Gist -> /github gist
    16) Get the latest Gist for the Authorized User -> /github gist 1
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
