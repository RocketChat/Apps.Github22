import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export async function helperMessage({
    room,
    read,
    persistence,
    modify,
    http,
    user
}: {
    room: IRoom;
    read: IRead;
    persistence: IPersistence;
    modify: IModify;
    http: IHttp;
    user?: IUser;
}) {
    let helperMessageString = `### Github App
    *The app can be accessed with any of the slash commands /gh or /github*
    1. Open the Home Modal to easily access various features -> \`/github\`
    2. See Interactive Button interface to fetch repository data -> \`/github Username/RepositoryName\`
    3. Get details of a Repository -> \`/github  Username/RepositoryName repo\`
    4. Get Issues of a Repository -> \`/github  Username/RepositoryName issues\`
    5. Get Contributors of a Repository -> \`/github  Username/RepositoryName contributors\`
    6. Get Recent Pull Request of a Repository -> \`/github  Username/RepositoryName pulls\`
    7. Review a Pull Request -> \`/github  Username/RepositoryName pulls pullNumber\`
    8. Login to GitHub -> \`/github login\`
    9. Logout from GitHub -> \`/github logout\`
    10. View your GitHub Profile and Issues -> \`/github me\`
    11. View/Add/Delete/Update Repository Subscriptions -> \`/github subscribe\`
    12. Subscribe to all repository events -> \`/github Username/RepositoryName subscribe\`
    13. Unsubscribe to all repository events -> \`/github Username/RepositoryName unsubscribe\`
    14. Add New Issues to GitHub Repository -> \`/github issue\`
    15. Search Issues and Pull Requests -> \`/github search\`
    16. Assign and Share Issues -> \`/github issues\`
    17. Add a new repository for pull request review reminders -> \`/github reminder create\`
    18. Get a list of repositories for which you've set up pull request review reminders -> \`/github reminder list\`
    `;

    const textSender = await modify
        .getCreator()
        .startMessage()
        .setText(`${helperMessageString}`);

    if (room) {
        textSender.setRoom(room);
    }

    await modify.getNotifier().notifyUser(user as IUser, textSender.getMessage());
}
