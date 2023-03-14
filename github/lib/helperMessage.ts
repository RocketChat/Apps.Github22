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
    *The app can be accessed with any of the slash commands /gh or /github*
    1) See Interactive Button interface to fetch repository data -> /github Username/RepositoryName
    2) Get details of a Repository -> /github  Username/RepositoryName repo
    3) Get Issues of a Repository -> /github  Username/RepositoryName issues
    4) Get Contributors of a Repository -> /github  Username/RepositoryName contributors
    5) Get Recent Pull Request of a Repository -> /github  Username/RepositoryName pulls
    6) Review a Pull Request -> /github  Username/RepositoryName pulls pullNumber
    7) Login to GitHub -> /github login
    8) Logout from GitHub -> /github logout
    9) View your GitHub Profile and Issues -> /github me
    10) View/Add/Delete/Update Repository Subscriptions -> /github subscribe
    11) Subscribe to all repository events -> /github Username/RepositoryName subscribe
    12) Unsubscribe to all repository events -> /github Username/RepositoryName unsubscribe
    13) Add New Issues to GitHub Repository -> /github issue
    14) Search Issues and Pull Requests -> /github search
    15) Assign and Share Issues -> /github issues
    `;

    const textSender = await modify
        .getCreator()
        .startMessage()
        .setText(`${helperMessageString}`);

    if (room) {
        textSender.setRoom(room);
    }
    await modify.getCreator().finish(textSender);
}
