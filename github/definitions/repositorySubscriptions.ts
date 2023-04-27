import { IUser } from "@rocket.chat/apps-engine/definition/users";

//subscriptions which will be saved in the apps local storage
export interface IRepositorySubscriptions{
    webhookId : string,
    repoName : string,
    user : IUser ,
    events : Array<string> 
}