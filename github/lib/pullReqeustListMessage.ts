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

export async function pullRequestListMessage({
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
        `https://api.github.com/repos/${repository}/pulls`
    );
    const resData = gitResponse.data;
    const room: IRoom = context.getRoom();
    const textSender = await modify
        .getCreator()
        .startMessage()
        .setText(`*PULL REQUESTS*`);

    if (room) {
        textSender.setRoom(room);
    }

    await modify.getCreator().finish(textSender);
    resData.forEach(async (pull, ind) => {
        if (ind < 10) {
            const url = pull.html_url;
            const textSender = await modify
                .getCreator()
                .startMessage()
                .setText(`[ #${pull.number} ](${url})  *${pull.title}*`);

            if (room) {
                textSender.setRoom(room);
            }
            await modify.getCreator().finish(textSender);
        }
    });
}
