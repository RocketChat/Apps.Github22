import { IRead, IPersistence, IHttp, IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { GithubApp } from "../GithubApp";
import { sendNotification } from "../lib/message";
import { NewIssueStarterModal } from "../modals/newIssueStarterModal";
import { getAccessTokenForUser } from "../persistance/auth";
import { GitHubIssuesStarterModal } from "../modals/getIssuesStarterModal";
import { getGithubOauthBlock } from "../oath2/authentication";
import { createSectionBlock } from "../lib/blocks";

export async function handleNewIssue(
    read: IRead,
    context: SlashCommandContext,
    app: GithubApp,
    persistence: IPersistence,
    http: IHttp,
    room: IRoom,
    modify: IModify
){
    let accessToken = await getAccessTokenForUser(
        read,
        context.getSender(),
        app.oauth2Config
    );
    if (accessToken && accessToken.token) {
        const triggerId = context.getTriggerId();
        if (triggerId) {
            const modal = await NewIssueStarterModal({
                modify: modify,
                read: read,
                persistence: persistence,
                http: http,
                slashcommandcontext: context,
            });
            await modify
                .getUiController()
                .openModalView(
                    modal,
                    { triggerId },
                    context.getSender()
                );
        } else {
            console.log("Inavlid Trigger ID !");
        }
    } else {
        const user = context.getSender();
        const message = `Login to add a new issue!`;
        const block = await getGithubOauthBlock(app, user, modify, message);
        await sendNotification(
            read,
            modify,
            user,
            room,
            message,
            block
        );
    }
}

export async function handleIssues(
    read: IRead,
    context: SlashCommandContext,
    app: GithubApp,
    persistence: IPersistence,
    http: IHttp,
    room: IRoom,
    modify: IModify
){
    const triggerId= context.getTriggerId();
    if(triggerId){
        const modal = await GitHubIssuesStarterModal({modify,read,persistence,http,slashcommandcontext:context});
        await modify.getUiController().openModalView(modal,{triggerId},context.getSender());
    }else{
        console.log("Inavlid Trigger ID !");
    }

}
