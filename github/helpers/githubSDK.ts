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

export async function getRepoData( 
    http: IHttp,
    repoName: string,
    access_token: string,
) {
    const response = await http.get(`https://api.github.com/repos/${repoName}`,{
        headers: {
            Authorization: `token ${access_token}`,
            "Content-Type": "application/json",
        }
    });

    // If it isn't a 2xx code, something wrong happened
    let JSONResponse = JSON.parse(response.content || "{}");
    if (!response.statusCode.toString().startsWith("2")) {
        JSONResponse["serverError"] = true;
    }else{
        JSONResponse["serverError"] = false;
    }

    return JSONResponse;
}

export async function mergePullRequest( 
    http: IHttp,
    repoName: string,
    access_token: string,
    pullRequestNumber: string|number,
    commitTitle: string,
    commitMessage: string,
    method:string,
) {
    let data = {};
    if(commitTitle?.length){
        data["commit_title"] = commitTitle;
    }
    if(commitMessage?.length){
        data["commit_message"] = commitMessage;
    }
    if(method?.length){
        data["merge_method"] = method;
    }
    const response = await http.put(`https://api.github.com/repos/${repoName}/pulls/${pullRequestNumber}/merge`,{
        headers: {
            Authorization: `token ${access_token}`,
            "Content-Type": "application/json",
        },
        data
    });
     // If it isn't a 2xx code, something wrong happened
    let JSONResponse = JSON.parse(response.content || "{}");
    if (!response.statusCode.toString().startsWith("2")) {
        JSONResponse["serverError"] = true;
    }else{
        JSONResponse["serverError"] = false;
    }

    return JSONResponse;
}


