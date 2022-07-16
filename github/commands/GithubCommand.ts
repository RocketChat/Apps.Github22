import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ProcessorsEnum } from "../enum/Processors";
import { GithubApp } from "../GithubApp";
import { initiatorMessage } from "../lib/initiatorMessage";
import { helperMessage } from "../lib/helperMessage";
import { basicQueryMessage } from "../helpers/basicQueryMessage";
import { pullDetailsModal } from "../modals/pullDetailsModal";
import { authorize } from "../oath2/authentication";
import { SubcommandEnum } from "../enum/Subcommands";
import { getAccessTokenForUser } from "../persistance/auth";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { removeToken } from "../persistance/auth";
import { getWebhookUrl } from "../helpers/getWebhookURL";
import { githubWebHooks } from "../endpoints/githubEndpoints";
import { sendDirectMessage, sendNotification } from "../lib/message";
import { createSubscription, deleteSubscription, updateSubscription } from "../helpers/githubSDK";
import { Subscription } from "../persistance/subscriptions";
import { ISubscription } from "../definitions/subscription";
import { subsciptionsModal } from "../modals/subscriptionsModal";

export class GithubCommand implements ISlashCommand {
    public constructor(private readonly app: GithubApp) {}
    public command = "github";
    public i18nDescription = "fetching githup data";
    public providesPreview = false;
    public i18nParamsExample = "";

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence
    ): Promise<void> {
       
        const command = context.getArguments();
        const sender = context.getSender();
        const room = context.getRoom();

        if(!Array.isArray(command)){
            return;
        }
        
        switch (command?.length) {
            case 0:{
                await helperMessage({room,read, persistence, modify, http});
                break;      
            }
            case 1 : {
                const data = {
                    room: room,
                    sender: sender,
                    arguments: command,
                };
                if(command[0].includes('/')){
                    await initiatorMessage({ data, read, persistence, modify, http });
                }else{
                    switch(command[0]){
                        case SubcommandEnum.LOGIN : {
                            await authorize(this.app, read, modify, context.getSender(),room, persistence);
                            break;
                        }
                        case SubcommandEnum.TEST : {
                            //test command
                            break;
                        }
                        case SubcommandEnum.SUBSCRIBE :{
                            //modal
                            let accessToken = await getAccessTokenForUser(read,context.getSender(),this.app.oauth2Config);
                            if(accessToken && accessToken.token){
                                const triggerId= context.getTriggerId();
                                if(triggerId){
                                    const modal = await subsciptionsModal({modify,read,persistence,http,slashcommandcontext:context});
                                    await modify.getUiController().openModalView(modal,{triggerId},context.getSender());
                                }else{
                                    console.log("Inavlid Trigger ID !");
                                }
                            }else{
                                await sendNotification(read,modify,context.getSender(),room,"Login to subscribe to repository events ! `/github login`");
                            }
                            break;
                        } 
                        default:{
                            await helperMessage({room,read, persistence, modify, http});
                            break;
                        }
                    }
                }               
                break;
            }
            case 2 : {
                
                const repository = command[0]; 
                const query = command[1];

                switch(query){
                    case SubcommandEnum.SUBSCRIBE : {
                        //sub
                        let accessToken = await getAccessTokenForUser(read,context.getSender(),this.app.oauth2Config);
                        if(accessToken && accessToken?.token){
                            try {
                                let events: Array<string> =["pull_request","push","issues","deployment_status","star"];
                                //if hook exists we set its take its hook id and add our aditional events to it
                                let eventSusbcriptions = new Map<string,boolean>;//this helps us mark the new events to be added
                                for(let event of events){
                                    eventSusbcriptions.set(event,false);
                                }
                                let url = await getWebhookUrl(this.app);
                                let subsciptionStorage = new Subscription(persistence,read.getPersistenceReader());
                                let user = await context.getSender();                                
                                let repositorySubscriptions = await subsciptionStorage.getSubscriptionsByRepo(repository,user.id);
                                let hookId = "";
                                for(let susbcription of repositorySubscriptions){
                                    if(hookId==""){
                                        hookId=susbcription.webhookId;
                                    }
                                    eventSusbcriptions.set(susbcription.event,true);
                                }
                                let newEvents:Array<string>=[];
                                for(let [event,value] of eventSusbcriptions){
                                    if(!value){
                                        newEvents.push(event);
                                    }
                                }
                                let createdEntry = false ;
                                if(hookId==""){
                                    let response = await createSubscription(http,repository,url,accessToken.token,events);
                                    hookId=response.id;
                                }else{
                                    if(newEvents.length){
                                        let response = await updateSubscription(http,repository,accessToken.token,hookId,events); 
                                        hookId=response.id;
                                    }
                                }
                                for(let event of events){
                                    createdEntry = await subsciptionStorage.createSubscription(repository,event,hookId,room,context.getSender());
                                }
                                if(!createdEntry){
                                    throw new Error("Error creating new susbcription entry");
                                }
                               
                                await sendNotification(read,modify,context.getSender(),room,`Subscibed to ${repository} ✔️`);

                            } catch (error) {
                                console.log("SubcommandError",error);
                            }
                        } else{
                            await sendNotification(read,modify,context.getSender(),room,"Login to subscribe to repository events ! `/github login`");
                        }
                        break;
                    }
                    case SubcommandEnum.UNSUBSCRIBE : {
                        //unsub
                        let accessToken = await getAccessTokenForUser(read,context.getSender(),this.app.oauth2Config);
                        if(accessToken && accessToken?.token){
                            try {
                                let user = await context.getSender();   
                                let events: Array<string> =["pull_request","push","issues","deployment_status","star"];
                                let subsciptionStorage = new Subscription(persistence,read.getPersistenceReader())
                                let oldSubscriptions = await subsciptionStorage.getSubscriptionsByRepo(repository,user.id);
                                await subsciptionStorage.deleteSubscriptionsByRepoUser(repository, room.id, user.id);
                                let hookId = "";
                                //check if any subscription events of the repo is left in any other room
                                let eventSubscriptions = new Map<string, boolean>;
                                for (let subsciption of oldSubscriptions) {
                                    eventSubscriptions.set(subsciption.event, false);
                                    if(hookId == ""){
                                        hookId = subsciption.webhookId;
                                    }
                                }
                                let updatedsubscriptions = await subsciptionStorage.getSubscriptionsByRepo(repository, user.id);
                                if (updatedsubscriptions.length == 0) {
                                    await deleteSubscription(http, repository, accessToken.token, hookId);
                                } else {
                                    for (let subsciption of updatedsubscriptions) {
                                        eventSubscriptions.set(subsciption.event, true);
                                    }
                                    let updatedEvents: Array<string> = [];
                                    let sameEvents = true;
                                    for (let [event, present] of eventSubscriptions) {
                                        sameEvents = sameEvents && present;
                                        if (present) {
                                            updatedEvents.push(event);
                                        }
                                    }
                                    if (updatedEvents.length && !sameEvents) {
                                        let response = await updateSubscription(http, repository, accessToken.token, hookId, updatedEvents);
                                    }
                                }
    
                                await sendNotification(read, modify, user, room, `Unsubscribed to ${repository} 🔕`);

                            } catch (error) {
                                console.log("SubcommandError",error);
                            }
                        } else{
                            await sendNotification(read,modify,context.getSender(),room,"Login to subscribe to repository events ! `/github login`");
                        }
                        break;
                    }
                    default:{
                        await basicQueryMessage ({query,repository,room,read,persistence,modify,http});
                        break;
                    }
                }
                break;                
            }
            case 3 : {
               const data = {
                    repository:command[0],
                    query:command[1],
                    number:command[2]
                }
                const triggerId= context.getTriggerId();
                if(triggerId){
                    const modal = await pullDetailsModal({data,modify,read,persistence,http,slashcommandcontext:context});
                    await modify.getUiController().openModalView(modal,{triggerId},context.getSender());
                }else{
                    console.log("Inavlid Trigger ID !");
                }
                break;
            }
            default:{
                await helperMessage({room,read, persistence, modify, http});
                break;
            }
            
        }
    
    }}//rc-apps deploy --url https://community.liaison.edge.rocketchat.digital --username samad.yar.khan --password samad --update
