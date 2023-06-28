import { IMessage } from "@rocket.chat/apps-engine/definition/messages";

export async function hasCodeLink(message: IMessage): Promise<Boolean> {
    let lineNo: RegExp =
        /https?:\/\/github\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+\/blob\/[A-Za-z0-9_-]+\/.+/;

    if (lineNo.test(message.text!)) {
        return true;
    }
    return false;
}

export async function hasGithubPRLink(message: IMessage): Promise<Boolean> {
    let prLink: RegExp = /https?:\/\/github\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+\/pull\/[0-9]+/;
    if (prLink.test(message.text!)) {
        return true;
    }
    return false;
}

export async function isGithubLink(message: IMessage) {
    let githubLink: RegExp = /(?:https?:\/\/)?(?:www\.)?github\.com\//;
    if (githubLink.test(message.text!)) {
        return true;
    }
    return false;
}