//subscriptions which will be saved in the apps local storage
export interface ISubscription{
    webhookId : string,
    user: string, 
    repoName : string,
    room : string,
    event: string
}