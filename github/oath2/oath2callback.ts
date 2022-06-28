import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IAuthData } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";
import { sendDirectMessage } from "../lib/message";
import { ProcessorsEnum } from "../enum/Processors";

export default async function authorizationCallback(
    token: IAuthData,
    user: IUser,
    read: IRead,
    modify: IModify,
    http: IHttp,
    persistence: IPersistence
) {
    // const deleteTokenTask = {
    //     id: ProcessorsEnum.REMOVE_GITHUB_LOGIN,
    //     when: '7 seconds',
    //     data: { 
    //        user
    //     },
    // }; 
    let text = `GitHub Authentication Succesfull 🚀`;
   
    if (token) {
        // await registerAuthorizedUser(read, persistence, user);
        // await modify.getScheduler().scheduleOnce(deleteTokenTask);
    } else {
        text = `Authentication Failure 😔`;
    }
    await sendDirectMessage(read, modify, user, text, persistence);
}