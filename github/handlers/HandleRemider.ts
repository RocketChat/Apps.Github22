import { IRead, IPersistence, IHttp, IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { GithubApp } from "../GithubApp";
import { sendNotification } from "../lib/message";
import { NewIssueStarterModal } from "../modals/newIssueStarterModal";
import { getAccessTokenForUser } from "../persistance/auth";
import { GitHubIssuesStarterModal } from "../modals/getIssuesStarterModal";
import { NewReminderStarterModal } from "../modals/newreminderModal";
import { reminderModal } from "../modals/remindersModal";

export async function handleReminder(
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
            const modal = await NewReminderStarterModal({
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
            console.log("invalid Trigger ID !");
        }
    } else {
        await sendNotification(
            read,
            modify,
            context.getSender(),
            room,
            "Login to add Pull Request reminder! `/github login`"
        );
    }
}

export async function ManageReminders(
    read:IRead,
    context:SlashCommandContext,
    app:GithubApp,
    persistence:IPersistence,
    http:IHttp,
    room:IRoom,
    modify:IModify
){
    let accessToken = await getAccessTokenForUser(
        read,
        context.getSender(),
        app.oauth2Config
    );
    if (accessToken && accessToken.token) {
        const triggerId = context.getTriggerId();
        if (triggerId) {
            const modal = await reminderModal({
                modify: modify,
                read: read,
                persistence: persistence,
                http: http,
                slashcommandcontext: context,
            });
            await modify
                .getUiController()
                .openModalView(modal, { triggerId }, context.getSender());
        } else {
            console.log("Invalid Trigger ID !");
        }
    } else {
        await sendNotification(
            read,
            modify,
            context.getSender(),
            room,
            "Login to see to pull request reminders! `/github login`"
        );
    }
}