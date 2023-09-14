import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { GithubApp } from "../GithubApp";
import { HandleInvalidRepoName } from "./HandleInvalidRepoName";
import { IAuthData, IOAuth2ClientOptions } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";
import { getAccessTokenForUser } from "../persistance/auth";
import { persistreminder } from "../persistance/remind";

export async function createReminder(
    repository: string,
    room: IRoom,
    read: IRead,
    context:SlashCommandContext,
    app:GithubApp,
    command:string[],
    persistence: IPersistence,
    modify: IModify,
    http: IHttp,
    user: IUser
) {
    
    const repoName = repository;

    const accessToken = (await getAccessTokenForUser(
        read,
        user,
        app.oauth2Config
    )) as IAuthData;

    const isValidRepo = await HandleInvalidRepoName(
        repoName,
        http,
        app,
        modify,
        user,
        read,
        room
    )

    if(!isValidRepo){
        console.log('invalid')
        return;
    }else{
    console.log('remidner adding ')
    persistreminder(read,persistence,user,repoName);
    }


    console.log(repoName,isValidRepo,accessToken)

    // nested array of user's and repo     
}
