import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { GithubApp } from "../GithubApp";
import { isRepositoryExist } from "../helpers/githubSDK";
import { getAccessTokenForUser } from "../persistance/auth";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IAuthData } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";

export async function HandleInvalidRepoName(
    repoName: string,
    http: IHttp,
    app: GithubApp,
    modify: IModify,
    sender: IUser,
    read: IRead,
    room: IRoom
): Promise<boolean> {
    const accessTokenInfo = (await getAccessTokenForUser(
        read,
        sender,
        app.oauth2Config
    )) as IAuthData;

    const access_token = (accessTokenInfo == undefined) ? undefined : accessTokenInfo.token;
    
    const isValidRepository: boolean = await isRepositoryExist(
        http,
        repoName,
        access_token
    );

    if (!isValidRepository) {
        const warningBuilder = await modify
            .getCreator()
            .startMessage()
            .setRoom(room)
            .setText(
                `Hey ${sender.username}! Provided repository doesn't exist or you need to login to access private repo.`
            );

        if (room.type !== "l") {
            await modify
                .getNotifier()
                .notifyUser(sender, warningBuilder.getMessage());
        } else {
            await modify.getCreator().finish(warningBuilder);
        }
    }

    return isValidRepository;
}

