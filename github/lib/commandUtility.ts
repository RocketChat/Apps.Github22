import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { helperMessage } from "./helperMessage";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { initiatorMessage } from "./initiatorMessage";
import { SubcommandEnum } from "../enum/Subcommands";
import { GithubApp } from "../GithubApp";
import { getAccessTokenForUser } from "../persistance/auth";
import { sendNotification } from "../lib/message";
import { subsciptionsModal } from "../modals/subscriptionsModal";
import { NewIssueStarterModal } from "../modals/newIssueStarterModal";
import { githubSearchModal } from "../modals/githubSearchModal";
import { getWebhookUrl } from "../helpers/getWebhookURL";
import { createSubscription, updateSubscription, deleteSubscription } from "../helpers/githubSDK";
import { Subscription } from "../persistance/subscriptions";
import { basicQueryMessage } from "../helpers/basicQueryMessage";
import { pullDetailsModal } from "../modals/pullDetailsModal";
import { ExecutorProps } from "../definitions/ExecutorProps";
import { handleLogin, handleLogout } from "../processors/AuthenticationHandler";

export class CommandUtility implements ExecutorProps {
    sender: IUser;
    room: IRoom;
    command: string[];
    context: SlashCommandContext;
    read: IRead;
    modify: IModify;
    http: IHttp;
    persistence: IPersistence;
    app: GithubApp;


    constructor(props : ExecutorProps){
        this.sender = props.sender;
        this.room = props.room;
        this.command = props.command;
        this.context = props.context;
        this.read = props.read;
        this.modify = props.modify;
        this.http = props.http;
        this.persistence = props.persistence;
        this.app = props.app
    }

    private async handleSubscribe(){
        let accessToken = await getAccessTokenForUser(this.read, this.context.getSender(), this.app.oauth2Config);
        if (accessToken && accessToken.token){
            const triggerId = this.context.getTriggerId();
            if (triggerId){
                const modal = await subsciptionsModal({modify: this.modify, read: this.read,persistence: this.persistence,http: this.http,slashcommandcontext:this.context});
                await this.modify.getUiController().openModalView(modal, {triggerId}, this.context.getSender());
            }
            else {
                console.log("Invalid Trigger ID !");
            }
        }
        else {
            await sendNotification(this.read, this.modify, this.context.getSender(), this.room, "Login to subscribe to repository events ! `/github login`")
        }
    }

    private async handleNewIssue() {
        let accessToken = await getAccessTokenForUser(this.read, this.context.getSender(), this.app.oauth2Config);
        if(accessToken && accessToken.token){
            const triggerId= this.context.getTriggerId();
            if(triggerId){
                const modal = await NewIssueStarterModal({modify: this.modify, read: this.read,persistence: this.persistence,http: this.http,slashcommandcontext:this.context});
                await this.modify.getUiController().openModalView(modal,{triggerId},this.context.getSender());
            }else{
                console.log("Inavlid Trigger ID !");
            }
        } else {
            await sendNotification(this.read,this.modify,this.context.getSender(),this.room,"Login to subscribe to repository events ! `/github login`");
        }
    }

    private async handleSearch() {
        let accessToken = await getAccessTokenForUser(this.read, this.context.getSender(), this.app.oauth2Config);
        if(accessToken && accessToken.token){
            const triggerId= this.context.getTriggerId();
            if(triggerId){
                const modal = await githubSearchModal({modify: this.modify, read: this.read,persistence: this.persistence,http: this.http,slashcommandcontext:this.context});
                await this.modify.getUiController().openModalView(modal,{triggerId},this.context.getSender());
            }else{
                console.log("Inavlid Trigger ID !");
            }
        }else{
            await sendNotification(this.read,this.modify,this.context.getSender(),this.room,"Login to subscribe to repository events ! `/github login`");
        }
    }

    private async handleEventSubscription(){
        let accessToken = await getAccessTokenForUser(this.read, this.context.getSender(), this.app.oauth2Config);
        const repository = this.command[0];
        if(accessToken && accessToken?.token){
            try {
                let events: Array<string> =["pull_request","push","issues","deployment_status","star"];
                //if hook exists we set its take its hook id and add our aditional events to it
                let eventSusbcriptions = new Map<string,boolean>;//this helps us mark the new events to be added
                for(let event of events){
                    eventSusbcriptions.set(event,false);
                }
                let url = await getWebhookUrl(this.app);
                let subsciptionStorage = new Subscription(this.persistence,this.read.getPersistenceReader());
                let user = await this.context.getSender();
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
                    let response = await createSubscription(this.http,repository,url,accessToken.token,events);
                    hookId=response.id;
                }else{
                    if(newEvents.length){
                        let response = await updateSubscription(this.http,repository,accessToken.token,hookId,events);
                        hookId=response.id;
                    }
                }
                for(let event of events){
                    createdEntry = await subsciptionStorage.createSubscription(repository,event,hookId,this.room,this.context.getSender());
                }
                if(!createdEntry){
                    throw new Error("Error creating new susbcription entry");
                }

                await sendNotification(this.read,this.modify,this.context.getSender(),this.room,`Subscibed to ${repository} ✔️`);

            } catch (error) {
                console.log("SubcommandError",error);
            }
        }
    }

    private async handleEventUnsubscribe(){
        let accessToken = await getAccessTokenForUser(this.read, this.context.getSender(), this.app.oauth2Config);
        const repository = this.command[0];
        if(accessToken && accessToken?.token){
            try {
                let user = await this.context.getSender();
                let events: Array<string> =["pull_request","push","issues","deployment_status","star"];
                let subsciptionStorage = new Subscription(this.persistence,this.read.getPersistenceReader())
                let oldSubscriptions = await subsciptionStorage.getSubscriptionsByRepo(repository,user.id);
                await subsciptionStorage.deleteSubscriptionsByRepoUser(repository, this.room.id, user.id);
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
                    await deleteSubscription(this.http, repository, accessToken.token, hookId);
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
                        let response = await updateSubscription(this.http, repository, accessToken.token, hookId, updatedEvents);
                    }
                }

                await sendNotification(this.read, this.modify, user, this.room, `Unsubscribed to ${repository} 🔕`);

            } catch (error) {
                console.log("SubcommandError",error);
            }
        } else{
            await sendNotification(this.read,this.modify,this.context.getSender(),this.room,"Login to subscribe to repository events ! `/github login`");
        }
    }


    private async handleSingularParamCommands() {
        const data = {
            room : this.room,
            sender: this.sender,
            arguments: this.command,
        }
        if (this.command[0].includes('/')){
            await initiatorMessage({data, read: this.read, persistence: this.persistence, modify: this.modify, http: this.http});
        }
        else {
            switch(this.command[0]){
                case SubcommandEnum.LOGIN : {
                    await handleLogin(this.app, this.read, this.modify, this.context, this.room, this.persistence);
                    break;
                }
                case SubcommandEnum.LOGOUT : {
                    await handleLogout(this.app, this.read, this.modify, this.context, this.room, this.persistence, this.sender, this.http);
                    break;
                }
                case SubcommandEnum.TEST : {
                    break;
                }
                case SubcommandEnum.SUBSCRIBE : {
                    this.handleSubscribe();
                    break;
                }
                case SubcommandEnum.NEW_ISSUE : {
                    this.handleNewIssue();
                    break;
                }
                case SubcommandEnum.SEARCH : {
                    this.handleSearch();
                    break;
                }
                default : {
                    await helperMessage({room: this.room,read: this.read, persistence :this.persistence, modify: this.modify, http: this.http});
                    break;
                }
            }
        }
    }

    private async handleDualParamCommands() {
        const query = this.command[1];
        const repository = this.command[0];
        switch(query){
            case SubcommandEnum.SUBSCRIBE : {
                this.handleEventSubscription();
                break;
            }
            case SubcommandEnum.UNSUBSCRIBE : {
                this.handleEventUnsubscribe();
                break;
            }
            default : {
                await basicQueryMessage ({query,repository,room: this.room,read: this.read,persistence: this.persistence,modify: this.modify,http: this.http});
                break;
            }
        }
    }

    private async handleTriParamCommand() {
        const data = {
            repository:this.command[0],
            query:this.command[1],
            number:this.command[2]
        }
        const triggerId= this.context.getTriggerId();
        if(triggerId){
            const modal = await pullDetailsModal({data,modify: this.modify,read: this.read,persistence: this.persistence,http: this.http,slashcommandcontext:this.context});
            await this.modify.getUiController().openModalView(modal,{triggerId},this.context.getSender());
        }else{
            console.log("Inavlid Trigger ID !");
        }
    }


    public async resolveCommand() {
        switch(this.command.length){
            case 0:{
                await helperMessage({room: this.room, read: this.read, persistence: this.persistence, modify: this.modify, http: this.http});
                break;
            }
            case 1:{
                this.handleSingularParamCommands();
                break;
            }
            case 2:{
                this.handleDualParamCommands();
                break;
            }
            case 3:{
                this.handleTriParamCommand();
                break;
            }
            default:{
                await helperMessage({room: this.room, read: this.read, persistence: this.persistence, modify: this.modify, http: this.http});
                break;
            }
        }

    }

}
