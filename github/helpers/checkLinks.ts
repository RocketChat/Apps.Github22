import { IMessage } from "@rocket.chat/apps-engine/definition/messages";

export async function isGithubLink(message: IMessage) {
    let githubLink: RegExp = /(?:https?:\/\/)?(?:www\.)?github\.com\//;
    if (githubLink.test(message.text!)) {
        return true;
    }
    return false;
}

export async function hasRepoLink(message: IMessage) {
    // const repoLink1: RegExp = /https:\/\/github\.com\/\S+\/\S+\/?\s/;
    const repoLink1 = /https?:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9-_.]+\s(?!\/)/;
    const repoLink2 = /https?:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9-_.]+\/?$/;

    if (repoLink1.test(message.text!) || repoLink2.test(message.text!)) {

        return true;
    }
    return false;
}
