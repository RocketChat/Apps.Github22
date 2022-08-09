import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";

const BaseHost = "https://github.com/";
const BaseApiHost = "https://api.github.com/";
const BaseRepoApiHost = "https://api.github.com/repos/";


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

async function getRequest(
    http: IHttp,
    accessToken: String,
    url: string,
): Promise<any> {
    const response = await http.get(url, {
        headers: {
            Authorization: `token ${accessToken}`,
            "Content-Type": "application/json",
        },
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
    return postReqeust(http, access_token, BaseRepoApiHost + repoName + "/hooks", {
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
        BaseRepoApiHost + repoName + "/hooks/" + hookId
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
        BaseRepoApiHost + repoName + "/hooks/" + hookId,
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
        BaseRepoApiHost + repoName + "/hooks/" + hookId,
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
        BaseRepoApiHost + repoName + "/hooks/" + hookId,
        {
            active: true,
            add_events: events,
        }
    );
}

export async function githubSearchIssuesPulls(
    http: IHttp,
    repoName: string|undefined,
    access_token: string,
    resource: string|undefined,
    state : string|undefined,
    labels: Array<String>,
    authors: Array<String>,
    milestones: Array<String>
) {

    let queryString = "q=";
    let authorsFilter = "";
    let resourceFilter = "";
    let milestonesFilter = "";
    let labelsFiler = "";
    let stateFilter = "";
    let repositoryFilter = "";

    if(repoName?.length && repoName.includes("/")){
        repositoryFilter = `repo:${repoName} `;
    }

    if(resource){
        if(resource == "issue"){
            resourceFilter=`is:issue `;
        }else if(resource == "pull_request"){
            resourceFilter =`is:pr `;
        }
    }

    if(authors?.length){
        for(let author of authors){
            let authorQuery = `author:${author} `; 
            authorsFilter += authorQuery;
        }
    }

    if(milestones?.length){
        for(let milestone of milestones){
            let milestoneQuery = `milestone:${milestone} `; 
            milestonesFilter += milestoneQuery;
        }
    }

    if(labels?.length){
        let labelQuery = `label:`;
        let index = 0;
        for(let label of labels){
            if(index == labels.length-1){
                labelQuery += `${label} `; 
            }else{
                labelQuery += `${label},`; 
            }
            index++;
        }
        labelsFiler=labelQuery;
    }

    if(state){
        if(state == "open"){
            stateFilter=`state:open `;
        }
        if(state == "closed"){
            stateFilter=`state:closed `;
        }
    }

    if(repositoryFilter.length == 0 && authorsFilter.length == 0 && labelsFiler.length == 0){
        return {};
    }
    
    queryString = queryString  + resourceFilter + repositoryFilter + stateFilter + authorsFilter +  labelsFiler + milestonesFilter;
    let ecodedQueryString = encodeURI(queryString);
    
    const response = await http.get(BaseApiHost + "search/issues?" + ecodedQueryString, {
        headers: {
            Authorization: `token ${access_token}`,
            "Content-Type": "application/json",
        },
    });

    // If it isn't a 2xx code, something wrong happened
    let resultResponse = JSON.parse(response.content || "{}");
    if (!response.statusCode.toString().startsWith("2")) {
        resultResponse["server_error"] = true;
    }else{
        resultResponse["search_query"] = queryString;
        resultResponse["server_error"] = false;
    }
    return resultResponse;
}