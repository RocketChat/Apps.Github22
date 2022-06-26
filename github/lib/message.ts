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