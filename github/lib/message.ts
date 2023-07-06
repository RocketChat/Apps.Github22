import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom, RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { BlockBuilder, IBlock } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { NotificationsController } from './notifications';

export async function getDirect(read: IRead, modify: IModify, appUser: IUser, username: string): Promise <IRoom | undefined > {
    const usernames = [appUser.username, username];
    let room: IRoom;
    try {
        room = await read.getRoomReader().getDirectByUsernames(usernames);
    } catch (error) {
        console.log(error);
        return;
    }

    if (room) {
        return room;
    } else {
        let roomId: string;

        // Create direct room between botUser and username
        const newRoom = modify.getCreator().startRoom()
        .setType(RoomType.DIRECT_MESSAGE)
        .setCreator(appUser)
        .setMembersToBeAddedByUsernames(usernames);
        roomId = await modify.getCreator().finish(newRoom);
        return await read.getRoomReader().getById(roomId);
    }
}

export async function sendMessage(
    modify: IModify,
    room: IRoom,
    sender: IUser,
    message: string,
    blocks?: BlockBuilder | [IBlock],
): Promise<string> {

    const msg = modify.getCreator().startMessage()
        .setSender(sender)
        .setRoom(room)
        .setGroupable(false)
        .setParseUrls(false)
        .setText(message);

    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }

    return await modify.getCreator().finish(msg);
}

export async function shouldSendMessage(read: IRead, persistence: IPersistence, user: IUser): Promise<boolean> {
    const notificationsController = new NotificationsController(read, persistence, user);
    const notificationStatus = await notificationsController.getNotificationsStatus();

    return notificationStatus ? notificationStatus.status : true;
}

export async function sendNotification(read: IRead, modify: IModify, user: IUser, room: IRoom, message: string, blocks?: BlockBuilder): Promise<void> {
    const appUser = await read.getUserReader().getAppUser() as IUser;

    const msg = modify.getCreator().startMessage()
        .setSender(appUser)
        .setRoom(room)
        .setText(message);

    if (blocks) {
        msg.setBlocks(blocks);
    }

    return read.getNotifier().notifyUser(user, msg.getMessage());
}

export async function sendDirectMessage(
    read: IRead,
    modify: IModify,
    user: IUser,
    message: string,
    persistence: IPersistence,
    blocks?: BlockBuilder | [IBlock],
): Promise<string> {
    const appUser = await read.getUserReader().getAppUser() as IUser;
    const targetRoom = await getDirect(read, modify, appUser, user.username) as IRoom;

    const shouldSend = await shouldSendMessage(read, persistence, user);

    if (!shouldSend) { return ''; }

    return await sendMessage(modify, targetRoom, appUser, message, blocks);
}

export function isUserHighHierarchy(user: IUser): boolean {
    const clearanceList = ['admin', 'owner', 'moderator'];
    return user.roles.some((role) => clearanceList.includes(role));
}

export async function sendDirectMessageOnInstall(
    read: IRead,
    modify: IModify,
    user: IUser,
    persistence: IPersistence
) {
    if (user.roles.includes("admin")) {
        const message = `
        Hello **${user.name}!** Thank you for installing the **GitHub Rocket.Chat App**. 
        
        Here's some important information to get you started:
        
        \xa0\xa0• **Quick and Easy Setup**: You can log in to GitHub with just one click using the built-in OAuth2 mechanism.
        \xa0\xa0• **Stay Updated**: Subscribe to Repository Events to receive notifications about new issues, pull requests, and more.
        \xa0\xa0• **Review and Merge Pull Requests**: You can conveniently review and merge pull requests directly from RocketChat Channels.
        \xa0\xa0• **Create and Manage Issues**: Create new issues from RocketChat and easily search and share existing issues and pull requests using extensive filters.
        \xa0\xa0• **Slash Commands**: Access the app using the slash commands \`/gh\` or \`/github\`.
        
        To assist you further, use the power of \`/github help\` to unlock a world of enhanced teamwork
   
        To unlock the full potential of the GitHub App, you need to set up a **GitHub OAuth App**. Follow these steps:  
        \xa0\xa0• Set up a GitHub OAuth2 App by following the instructions provided.
        \xa0\xa0• Ensure the callback URL is set to your server's URL (Note: Remove any trailing '/' at the end of the hosted URL if authentication issues occur).
        \xa0\xa0• Once the GitHub OAuth app is set up, access the GitHub Application Settings and enter the GitHub App OAuth Client Id and Client Secret.
        
        We hope it enhances your collaboration and workflow. We would love to hear your feedback on your experience with the app. 
        Your feedback helps us improve and provide a better user experience. Please visit the link to [**provide your feedback**](https://github.com/RocketChat/Apps.Github22/issues)
        
        Happy collaborating with \`GitHub\` and \`RocketChat\` :rocket:
        `;
        await sendDirectMessage(read, modify, user, message, persistence);
    }
}
