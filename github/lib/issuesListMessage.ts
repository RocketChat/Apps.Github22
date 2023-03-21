import {
    IHttp,
    IMessageBuilder,
    IModify,
    IModifyCreator,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IAuthData } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export async function issueListMessage({
    repository,
    room,
    read,
    persistence,
    modify,
    http,
    accessToken,
}: {
    repository: String;
    room: IRoom;
    read: IRead;
    persistence: IPersistence;
    modify: IModify;
    http: IHttp;
    accessToken?: IAuthData;
}) {
    let gitResponse: any;
    if (accessToken?.token) {
        gitResponse = await http.get(
            `https://api.github.com/repos/${repository}/issues`,
            {
                headers: {
                    Authorization: `token ${accessToken?.token}`,
                    "Content-Type": "application/json",
                },
            }
        );
    } else {
        gitResponse = await http.get(
            `https://api.github.com/repos/${repository}/issues`
        );
    }
    const resData = gitResponse.data;
    const textSender = await modify
        .getCreator()
        .startMessage()
        .setText(`*ISSUES LIST*`);

    if (room) {
        textSender.setRoom(room);
    }
    let ind = 0;
    await modify.getCreator().finish(textSender);
    const sender = (await read.getUserReader().getAppUser()) as IUser;
    resData.forEach(async (issue) => {
        if (typeof issue.pull_request === "undefined" && ind < 10) {
            const textSender = await modify
                .getCreator()
                .startMessage()
                .setData({
                    room,
                    sender,
                    text: `[ #${issue.number} ](${issue.html_url})  *[${issue.title}](${issue.html_url})*`,
                    customFields: {
                        issue: true,
                        issue_url: issue.html_url,
                        issue_number: issue.number,
                        owner: issue.user.login,
                        repo_name: repository,
                    },
                });

            await modify.getCreator().finish(textSender);
            ind++;
        }
    });
}
