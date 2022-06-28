import {
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { GithubApp } from "../GithubApp";
import { IButton, createSectionBlock } from "../lib/blocks";
import { sendDirectMessage } from "../lib/message";

export async function authorize(
    app: GithubApp,
    read: IRead,
    modify: IModify,
    user: IUser,
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
    await sendDirectMessage(read, modify, user, message, persistence, block);
}
