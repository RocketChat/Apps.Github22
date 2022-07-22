import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";

const BaseHost = "https://github.com/";
const BaseApiHost = "https://api.github.com/repos/";

async function postReqeust(
    http: IHttp,
    accessToken: String,
    url: string,
    data: any
): Promise<any> {
    const response = await http.post(url, {
        headers: {
            Authorization: `token ${accessToken}`,
            "Content-Type": "application/json",
            "User-Agent": "Rocket.Chat-Apps-Engine",
        },
        data,
    });

    // If it isn't a 2xx code, something wrong happened
    if (!response.statusCode.toString().startsWith("2")) {
        throw response;
    }

    return JSON.parse(response.content || "{}");
}

async function deleteReqeust(
    http: IHttp,
    accessToken: String,
    url: string
): Promise<any> {
    const response = await http.del(url, {
        headers: {
            Authorization: `token ${accessToken}`,
            "Content-Type": "application/json",
            "User-Agent": "Rocket.Chat-Apps-Engine",
        },
    });

    // If it isn't a 2xx code, something wrong happened
    if (!response.statusCode.toString().startsWith("2")) {
        throw response;
    }

    return JSON.parse(response.content || "{}");
}

async function patchReqeust(
    http: IHttp,
    accessToken: String,
    url: string,
    data: any
): Promise<any> {
    const response = await http.patch(url, {
        headers: {
            Authorization: `token ${accessToken}`,
            "Content-Type": "application/json",
            "User-Agent": "Rocket.Chat-Apps-Engine",
        },
        data,
    });

    // If it isn't a 2xx code, something wrong happened
    if (!response.statusCode.toString().startsWith("2")) {
        throw response;
    }

    return JSON.parse(response.content || "{}");
}

export async function createSubscription(
    http: IHttp,
    repoName: string,
    webhookUrl: string,
    access_token: string,
    events: Array<String>
) {
    return postReqeust(http, access_token, BaseApiHost + repoName + "/hooks", {
        active: true,
        events: events,
        config: {
            url: webhookUrl,
            content_type: "json",
        },
    });
}

export async function deleteSubscription(
    http: IHttp,
    repoName: string,
    access_token: string,
    hookId: string
) {
    return deleteReqeust(
        http,
        access_token,
        BaseApiHost + repoName + "/hooks/" + hookId
    );
}

export async function updateSubscription(
    http: IHttp,
    repoName: string,
    access_token: string,
    hookId: string,
    events: Array<String>
) {
    return patchReqeust(
        http,
        access_token,
        BaseApiHost + repoName + "/hooks/" + hookId,
        {
            active: true,
            events: events,
        }
    );
}

export async function addSubscribedEvents(
    http: IHttp,
    repoName: string,
    access_token: string,
    hookId: string,
    events: Array<String>
) {
    return patchReqeust(
        http,
        access_token,
        BaseApiHost + repoName + "/hooks/" + hookId,
        {
            active: true,
            add_events: events,
        }
    );
}

export async function removeSubscribedEvents(
    http: IHttp,
    repoName: string,
    access_token: string,
    hookId: string,
    events: Array<String>
) {
    return patchReqeust(
        http,
        access_token,
        BaseApiHost + repoName + "/hooks/" + hookId,
        {
            active: true,
            add_events: events,
        }
    );
}

export async function createNewIssue(
    http: IHttp,
    repoName: string,
    issueTitle: string,
    issueBody: string,
    issueLabels: Array<string>,
    issueAssignees : Array<string>,
    access_token: string,
) {
    return postReqeust(http, access_token, BaseApiHost + repoName + "/issues", {
        title: issueTitle,
        body: issueBody,
        assignees: issueAssignees,
        labels: issueLabels
    });
}

export async function getIssueTemplates(
    http: IHttp,
    repoName: string,
    access_token: string,
) {
    //this does not use the get , post , patch method defined because we dont want to throw an error for an eror response
    const response = await http.get(`https://api.github.com/repos/${repoName}/contents/.github/ISSUE_TEMPLATE/`, {
        headers: {
            Authorization: `token ${access_token}`,
            "Content-Type": "application/json",
        }
    });

    // If it isn't a 2xx code, something wrong happened
    let repsonseJSON :any =  {};
    if (!response.statusCode.toString().startsWith("2")) {
        repsonseJSON["template_not_found"] = true;
    }else{
        repsonseJSON = {
            templates : JSON.parse(response.content || "{}"),
            repository: repoName,
            template_not_found : false
        }
    }
    return repsonseJSON;
}

export async function getIssueTemplateCode(
    http: IHttp,
    templateDownloadUrl: string,
    access_token: string,
) {
    //this does not use the get , post , patch method defined because we dont want to throw an error for an eror response
    const response = await http.get(templateDownloadUrl, {
        headers: {
            Authorization: `token ${access_token}`,
            "Content-Type": "application/json",
        }
    });

    // If it isn't a 2xx code, something wrong happened
    let repsonseJSON :any =  {};

    if (!response.statusCode.toString().startsWith("2")) {
        repsonseJSON = {
            template : ""
        }
    }else{
        repsonseJSON = {
            template : response.content || "",
        }
    }
    return repsonseJSON;
}