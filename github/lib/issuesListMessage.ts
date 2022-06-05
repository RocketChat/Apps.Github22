import {
    IHttp,
    IMessageBuilder,
    IModify,
    IModifyCreator,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";

export async function issueListMessage({
    context,
    read,
    persistence,
    modify,
    http,
}: {
    context: SlashCommandContext;
    read: IRead;
    persistence: IPersistence;
    modify: IModify;
    http: IHttp;
}) {
    const command = context.getArguments();
    const repository = command[0];
    const gitResponse = await http.get(
        `https://api.github.com/repos/${repository}/issues`
    );
    const resData = gitResponse.data;
    const room: IRoom = context.getRoom();
    const textSender = await modify
        .getCreator()
        .startMessage()
        .setText(`*ISSUES LIST*`);

    if (room) {
        textSender.setRoom(room);
    }
    let ind = 0;
    await modify.getCreator().finish(textSender);
    resData.forEach(async (issue) => {
        if (typeof issue.pull_request === "undefined" && ind < 10) {
            const textSender = await modify
                .getCreator()
                .startMessage()
                .setText(
                    `[ #${issue.number} ](${issue.html_url})  *${issue.title}*`
                );
            if (room) {
                textSender.setRoom(room);
            }
            await modify.getCreator().finish(textSender);
            ind++;
        }
    });
}
