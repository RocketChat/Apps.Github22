import {
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { GithubApp } from "../GithubApp";
import { IButton, createSectionBlock } from "../lib/blocks";
import { sendNotification } from "../lib/message";
import { storeInteractionRoomData } from "../persistance/roomInteraction";

export async function authorize(
    app: GithubApp,
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom,
    persistence: IPersistence
): Promise<void> {
    const url = await app
        .getOauth2ClientInstance()
        .getUserAuthorizationUrl(user);

    const button: IButton = {
        text: "GitHub Login",
        url: url.toString(),
    };
    const message = `Login to GitHub`;
    const block = await createSectionBlock(modify, message, button);
    await storeInteractionRoomData(persistence,user.id,room.id);
    await sendNotification(read, modify, user, room, message, block);
}
