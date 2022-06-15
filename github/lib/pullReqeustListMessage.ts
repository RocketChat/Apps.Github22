import {
    IHttp,
    IMessageBuilder,
    IModify,
    IModifyCreator,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

export async function pullRequestListMessage({
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
        `https://api.github.com/repos/${repository}/pulls`
    );
    const resData = gitResponse.data;
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
