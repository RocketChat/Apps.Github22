import { IMessage } from "@rocket.chat/apps-engine/definition/messages";

export async function isGithubLink(message: IMessage) {
    let githubLink: RegExp = /(?:https?:\/\/)?(?:www\.)?github\.com\//;
    if (githubLink.test(message.text!)) {
        return true;
    }
    return false;
}

export async function hasRepoLink(message: IMessage) {
    let repoLink1: RegExp = /https:\/\/github\.com\/\S+\/\S+\/?\s/;
    let repoLink2: RegExp = /https:\/\/github\.com\/\S+\/\S+\/?$/;

    if (repoLink1.test(message.text!) || repoLink2.test(message.text!)) {
        return true;
    }
    return false;
}
