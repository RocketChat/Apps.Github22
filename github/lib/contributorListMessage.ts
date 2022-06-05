import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";

export async function contributorListMessage({
    repository,
    room,
    read,
    persistence,
    modify,
    http,
}: {
    repository : String,
    room: IRoom;
    read: IRead;
    persistence: IPersistence;
    modify: IModify;
    http: IHttp;
}) {
    const gitResponse = await http.get(
        `https://api.github.com/repos/${repository}/contributors`
    );
    const resData = gitResponse.data;
    const textSender = await modify
        .getCreator()
        .startMessage()
        .setText(`*CONTRIBUTOR LIST*`);

    if (room) {
        textSender.setRoom(room);
    }

    await modify.getCreator().finish(textSender);
    resData.forEach(async (contributor, ind) => {
        if (ind < 20) {
            const login = contributor.login;
            const html_url = contributor.html_url;

            const textSender = await modify
                .getCreator()
                .startMessage()
                .setText(`[ ${login} ](${html_url})`);

            if (room) {
                textSender.setRoom(room);
            }

            await modify.getCreator().finish(textSender);
        }
    });
}
