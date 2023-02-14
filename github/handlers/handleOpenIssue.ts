import {
    IRead,
    IPersistence,
    IHttp,
    IModify,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    UIKitBlockInteractionContext,
    UIKitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { GithubApp } from "../GithubApp";
import { sendNotification } from "../lib/message";
import { NewIssueStarterModal } from "../modals/newIssueStarterModal";
import { getAccessTokenForUser } from "../persistance/auth";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export async function handleOpenIssue(
    read: IRead,
    context: UIKitBlockInteractionContext,
    app: GithubApp,
    persistence: IPersistence,
    http: IHttp,
    room: IRoom,
    modify: IModify
) {
 
    const user = context.getInteractionData().user as IUser;

    let accessToken = await getAccessTokenForUser(read, user, app.oauth2Config);

    if (accessToken && accessToken.token) {
        const triggerId: string = context.getInteractionData().triggerId;
        if (triggerId) {

            const modal = await NewIssueStarterModal({
                modify: modify,
                read: read,
                persistence: persistence,
                http: http,
                uikitcontext: context,
            });
            await modify
                .getUiController()
                .openModalView(modal, { triggerId }, user);
        } else {
            console.log("Inavlid Trigger ID !");
        }
    } else {
        await sendNotification(
            read,
            modify,
            user,
            room,
            "Login to subscribe to repository events ! `/github login`"
        );
    }
}
