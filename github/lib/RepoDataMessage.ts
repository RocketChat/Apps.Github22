import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
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
        `https://api.github.com/repos/${repository}`
    );
    const resData = gitResponse.data;
    const room: IRoom = context.getRoom();
    const fullName =
        "[" +
        resData.full_name +
        "](" +
        resData.html_url +
        ")" +
        " ▫️ ";
    const stars =
        "` ⭐ Stars " + resData.stargazers_count + " ` ";
    const issues = "` ❗ Issues " + resData.open_issues + " ` ";
    const forks = "` 🍴 Forks " + resData.forks_count + " ` ";
    let tags = "";
    if (
        resData &&
        resData.topics &&
        Array.isArray(resData.topics)
    ) {
        resData.topics.forEach((topic: string) => {
            let tempTopic = " ` ";
            tempTopic += topic;
            tempTopic += " ` ";
            tags += tempTopic;
        });
    }

    const textSender = await modify
        .getCreator()
        .startMessage()
        .setText(
            fullName +
                stars +
                issues +
                forks +
                "```" +
                resData.description +
                "```" +
                tags
        );
    if (room) {
        textSender.setRoom(room);
    }
    await modify.getCreator().finish(textSender);
}