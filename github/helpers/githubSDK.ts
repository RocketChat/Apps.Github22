import { IHttp, HttpStatusCode } from "@rocket.chat/apps-engine/definition/accessors";
import { IGitHubIssue } from "../definitions/githubIssue";
import { ModalsEnum } from "../enum/Modals";

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
    url: string
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
    return postReqeust(
        http,
        access_token,
        BaseRepoApiHost + repoName + "/hooks",
        {
            active: true,
            events: events,
            config: {
                url: webhookUrl,
                content_type: "json",
            },
        }
    );
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
export async function createNewIssue(
    http: IHttp,
    repoName: string,
    issueTitle: string,
    issueBody: string,
    issueLabels: Array<string>,
    issueAssignees: Array<string>,
    access_token: string
) {
    return postReqeust(
        http,
        access_token,
        BaseRepoApiHost + repoName + "/issues",
        {
            title: issueTitle,
            body: issueBody,
            assignees: issueAssignees,
            labels: issueLabels,
        }
    );
}

export async function getIssueTemplates(
    http: IHttp,
    repoName: string,
    access_token: string
) {
    //this does not use the get , post , patch method defined because we dont want to throw an error for an eror response
    const response = await http.get(
        `https://api.github.com/repos/${repoName}/contents/.github/ISSUE_TEMPLATE/`,
        {
            headers: {
                Authorization: `token ${access_token}`,
                "Content-Type": "application/json",
            },
        }
    );

    // If it isn't a 2xx code, something wrong happened
    let repsonseJSON: any = {};
    if (!response.statusCode.toString().startsWith("2")) {
        repsonseJSON["template_not_found"] = true;
    } else {
        repsonseJSON = {
            templates: JSON.parse(response.content || "{}"),
            repository: repoName,
            template_not_found: false,
        };
    }
    return repsonseJSON;
}

export async function getIssueTemplateCode(
    http: IHttp,
    templateDownloadUrl: string,
    access_token: string
) {
    //this does not use the get , post , patch method defined because we dont want to throw an error for an eror response
    const response = await http.get(templateDownloadUrl, {
        headers: {
            Authorization: `token ${access_token}`,
            "Content-Type": "application/json",
        },
    });

    // If it isn't a 2xx code, something wrong happened
    let repsonseJSON: any = {};

    if (!response.statusCode.toString().startsWith("2")) {
        repsonseJSON = {
            template: "",
        };
    } else {
        repsonseJSON = {
            template: response.content || "",
        };
    }
    return repsonseJSON;
}

export async function githubSearchIssuesPulls(
    http: IHttp,
    repoName: string | undefined,
    access_token: string,
    resource: string | undefined,
    state: string | undefined,
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

    if (repoName?.length && repoName.includes("/")) {
        repositoryFilter = `repo:${repoName} `;
    }

    if (resource) {
        if (resource == "issue") {
            resourceFilter = `is:issue `;
        } else if (resource == "pull_request") {
            resourceFilter = `is:pr `;
        }
    }

    if (authors?.length) {
        for (let author of authors) {
            let authorQuery = `author:${author} `;
            authorsFilter += authorQuery;
        }
    }

    if (milestones?.length) {
        for (let milestone of milestones) {
            let milestoneQuery = `milestone:${milestone} `;
            milestonesFilter += milestoneQuery;
        }
    }

    if (labels?.length) {
        let labelQuery = `label:`;
        let index = 0;
        for (let label of labels) {
            if (index == labels.length - 1) {
                labelQuery += `${label} `;
            } else {
                labelQuery += `${label},`;
            }
            index++;
        }
        labelsFiler = labelQuery;
    }

    if (state) {
        if (state == "open") {
            stateFilter = `state:open `;
        }
        if (state == "closed") {
            stateFilter = `state:closed `;
        }
    }

    if (
        repositoryFilter.length == 0 &&
        authorsFilter.length == 0 &&
        labelsFiler.length == 0
    ) {
        return {};
    }

    queryString =
        queryString +
        resourceFilter +
        repositoryFilter +
        stateFilter +
        authorsFilter +
        labelsFiler +
        milestonesFilter;
    let ecodedQueryString = encodeURI(queryString);

    const response = await http.get(
        BaseApiHost + "search/issues?" + ecodedQueryString,
        {
            headers: {
                Authorization: `token ${access_token}`,
                "Content-Type": "application/json",
            },
        }
    );
    // If it isn't a 2xx code, something wrong happened
    let resultResponse = JSON.parse(response.content || "{}");
    if (!response.statusCode.toString().startsWith("2")) {
        resultResponse["server_error"] = true;
    } else {
        resultResponse["search_query"] = queryString;
        resultResponse["server_error"] = false;
    }
    return resultResponse;
}

export async function getRepoData(
    http: IHttp,
    repoName: string,
    access_token: string
) {
    const response = await http.get(
        `https://api.github.com/repos/${repoName}`,
        {
            headers: {
                Authorization: `token ${access_token}`,
                "Content-Type": "application/json",
            },
        }
    );

    // If it isn't a 2xx code, something wrong happened
    let JSONResponse = JSON.parse(response.content || "{}");
    if (!response.statusCode.toString().startsWith("2")) {
        JSONResponse["serverError"] = true;
    } else {
        JSONResponse["serverError"] = false;
    }

    return JSONResponse;
}

export async function mergePullRequest(
    http: IHttp,
    repoName: string,
    access_token: string,
    pullRequestNumber: string | number,
    commitTitle: string,
    commitMessage: string,
    method: string
) {
    let data = {};
    if (commitTitle?.length) {
        data["commit_title"] = commitTitle;
    }
    if (commitMessage?.length) {
        data["commit_message"] = commitMessage;
    }
    if (method?.length) {
        data["merge_method"] = method;
    }
    const response = await http.put(
        `https://api.github.com/repos/${repoName}/pulls/${pullRequestNumber}/merge`,
        {
            headers: {
                Authorization: `token ${access_token}`,
                "Content-Type": "application/json",
            },
            data,
        }
    );
    // If it isn't a 2xx code, something wrong happened
    let JSONResponse = JSON.parse(response.content || "{}");
    if (!response.statusCode.toString().startsWith("2")) {
        JSONResponse["serverError"] = true;
    } else {
        JSONResponse["serverError"] = false;
    }

    return JSONResponse;
}

export async function getBasicUserInfo(
    http: IHttp,
    access_token: String,
) {
    try {
        const response = await getRequest(
            http,
            access_token,
            BaseApiHost + 'user'
        );
        return {
            username: response.login,
            name: response.name,
            email: response.email,
            bio: response.bio,
            followers: response.followers,
            following: response.following,
            avatar: response.avatar_url
        }
    } catch (e) {
        return {
            name: "",
            email: "",
            bio: "",
            followers: "",
            following: "",
            avatar: ""
        };
    }
}

export async function getUserAssignedIssues(
    http: IHttp,
    username: String,
    access_token: String,
    filter: {
        filter: String,
        state: String,
        sort: String
    },
): Promise<IGitHubIssue[]> {


    let url;

    switch (filter.filter) {
        case ModalsEnum.CREATED_ISSUE_FILTER:
            url = `https://api.github.com/search/issues?q=is:${filter.state}+is:issue+sort:${filter.sort.substring(5)}-desc+author:${username}`
            break;
        case ModalsEnum.ASSIGNED_ISSUE_FILTER:
            url = `https://api.github.com/search/issues?q=is:${filter.state}+is:issue+sort:${filter.sort.substring(5)}-desc+assignee:${username}`
            break;
        case ModalsEnum.MENTIONED_ISSUE_FILTER:
            url = `https://api.github.com/search/issues?q=is:${filter.state}+is:issue+sort:${filter.sort.substring(5)}-desc+mentions:${username}`
        default:
            break;
    }
    try {
        const response = await getRequest(
            http,
            access_token,
            url,
        );

        const getAssignees = (assignees: any[]): string[] => assignees.map((val): string => {
            return val.login as string;
        })

        const modifiedResponse: Array<IGitHubIssue> = response.items.map((value): IGitHubIssue => {
            return {
                issue_id: value.id as string,
                issue_compact: value.body as string,
                repo_url: value.repository_url as string,
                user_login: value.user.login as string,
                user_avatar: value.user.avatar_url as string,
                number: value.number as number,
                title: value.title as string,
                body: value.body as string,
                assignees: getAssignees(value.assignees),
                state: value.state as string,
                last_updated_at: value.updated_at as string,
                comments: value.comments as number,
            }
        })

        return modifiedResponse;
    }
    catch (e) {
        return [];
    }
}

export async function getIssueData(
    repoInfo: String,
    issueNumber: String,
    access_token: String | null,
    http: IHttp
): Promise<IGitHubIssue> {
    try {
        if(access_token){
            var response = await getRequest(http, access_token, BaseRepoApiHost + repoInfo + '/issues/' + issueNumber);
        }else{
            const result = await http.get(
                `https://api.github.com/repos/${repoInfo}/issues/${issueNumber}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
    
            // If it isn't a 2xx code, something wrong happened
            if (!result.statusCode.toString().startsWith("2")) {
                throw result;
            }
    
            var response = JSON.parse(result.content || "{}");
        }

        const getAssignees = (assignees: any[]): string[] => assignees.map((val): string => {
            return val.login as string;
        })

        return {
            issue_id: response.id as string,
            issue_compact: response.body as string,
            html_url: response.html_url as string,
            repo_url: response.repository_url as string,
            user_login: response.user.login as string,
            user_avatar: response.user.avatar_url as string,
            number: response.number as number,
            title: response.title as string,
            body: response.body as string,
            assignees: getAssignees(response.assignees),
            state: response.state as string,
            last_updated_at: response.updated_at as string,
            comments: response.comments as number,
            reactions: {
                total_count: response.reactions["total_count"],
                plus_one: response.reactions["+1"],
                minus_one: response.reactions["-1"],
                laugh: response.reactions["laugh"],
                hooray: response.reactions["hooray"],
                confused: response.reactions["confused"],
                heart: response.reactions["heart"],
                rocket: response.reactions["rocket"],
                eyes: response.reactions["eyes"]
            }
        }
    } catch (e) {
        return {
            issue_compact: "Error Fetching Issue",
            issue_id: 0
        }
    }
}

export async function addNewPullRequestComment(
    http: IHttp,
    repoName: string,
    access_token: string,
    pullRequestNumber: string | number,
    newComment: string
) {
    let data = {
        body: newComment,
    };
    const response = await http.post(
        `https://api.github.com/repos/${repoName}/issues/${pullRequestNumber}/comments`,
        {
            headers: {
                Authorization: `token ${access_token}`,
                "Content-Type": "application/json",
            },
            data,
        }
    );
    // If it isn't a 2xx code, something wrong happened
    let JSONResponse = JSON.parse(response.content || "{}");
    if (!response.statusCode.toString().startsWith("2")) {
        JSONResponse["serverError"] = true;
    } else {
        JSONResponse["serverError"] = false;
    }

    return JSONResponse;
}

export async function getPullRequestComments(
    http: IHttp,
    repoName: string,
    access_token: string,
    pullRequestNumber: string | number
) {
    const response = await http.get(
        `https://api.github.com/repos/${repoName}/issues/${pullRequestNumber}/comments`,
        {
            headers: {
                Authorization: `token ${access_token}`,
                "Content-Type": "application/json",
            },
        }
    );
    // If it isn't a 2xx code, something wrong happened
    let JSONResponse = JSON.parse("{}");
    if (!response.statusCode.toString().startsWith("2")) {
        JSONResponse = JSON.parse(response.content || "{}");
        JSONResponse["serverError"] = true;
    } else {
        JSONResponse["data"] = JSON.parse(response.content || "[]");
        JSONResponse["serverError"] = false;
    }
    return JSONResponse;
}

export async function getIssuesComments(
    http: IHttp,
    repoName: string,
    access_token: String | null,
    issueNumber: string | number
) {
    if(access_token){
        var response = await http.get(
            `https://api.github.com/repos/${repoName}/issues/${issueNumber}/comments`,
            {
                headers: {
                    Authorization: `token ${access_token}`,
                    "Content-Type": "application/json",
                },
            }
        );
    }else{
        var response = await http.get(
            `https://api.github.com/repos/${repoName}/issues/${issueNumber}/comments`,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
    // If it isn't a 2xx code, something wrong happened
    let JSONResponse = JSON.parse("{}");
    if (!response.statusCode.toString().startsWith("2")) {
        JSONResponse = JSON.parse(response.content || "{}");
        JSONResponse["serverError"] = true;
    } else {
        JSONResponse["data"] = JSON.parse(response.content || "[]");
        JSONResponse["serverError"] = false;
    }
    return JSONResponse;
}

export async function addNewIssueComment(
    http: IHttp,
    repoName: string,
    access_token: string,
    issueNumber: string | number,
    newComment: string
) {
    let data = {
        body: newComment,
    };
    const response = await http.post(
        `https://api.github.com/repos/${repoName}/issues/${issueNumber}/comments`,
        {
            headers: {
                Authorization: `token ${access_token}`,
                "Content-Type": "application/json",
            },
            data,
        }
    );
    // If it isn't a 2xx code, something wrong happened
    let JSONResponse = JSON.parse(response.content || "{}");
    if (!response.statusCode.toString().startsWith("2")) {
        JSONResponse["serverError"] = true;
    } else {
        JSONResponse["serverError"] = false;
    }

    return JSONResponse;
}

export async function getPullRequestData(
    http: IHttp,
    repoName: string,
    access_token: string,
    pullRequestNumber: string | number
) {
    const response = await http.get(
        `https://api.github.com/repos/${repoName}/pulls/${pullRequestNumber}`,
        {
            headers: {
                Authorization: `token ${access_token}`,
                "Content-Type": "application/json",
            },
        }
    );
    // If it isn't a 2xx code, something wrong happened
    let JSONResponse = JSON.parse(response.content || "{}");
    if (!response.statusCode.toString().startsWith("2")) {
        JSONResponse["serverError"] = true;
    } else {
        JSONResponse["serverError"] = false;
    }
    return JSONResponse;
}

export async function getRepositoryIssues(
    http: IHttp,
    repoName: string,
    access_token?: string
) {
    //this does not use the get , post , patch method defined because we dont want to throw an error for an eror response
    let response: any;

    if (access_token) {
        response = await http.get(BaseRepoApiHost + repoName + "/issues", {
            headers: {
                Authorization: `token ${access_token}`,
                "Content-Type": "application/json",
            },
        });
    } else {
        response = await http.get(BaseRepoApiHost + repoName + "/issues", {
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
    let repsonseJSON: any = {};
    // If it isn't a 2xx code, something wrong happened
    if (!response.statusCode.toString().startsWith("2")) {
        repsonseJSON = JSON.parse(response.content || "{}");
        repsonseJSON["serverError"] = true;
    } else {
        repsonseJSON = {
            issues: JSON.parse(response.content || "{}"),
            repository: repoName,
            serverError: false,
        };
    }
    return repsonseJSON;
}

export async function updateGithubIssues(
    http: IHttp,
    repoName: string,
    assignees: Array<string>,
    issueNumber: string | number,
    access_token: string
) {
    //this does not use the get , post , patch method defined because we dont want to throw an error for an eror response
    let response: any;
    let data = {
        assignees: assignees,
    };
    response = await http.patch(
        BaseRepoApiHost + repoName + `/issues/${issueNumber}`,
        {
            headers: {
                Authorization: `token ${access_token}`,
                "Content-Type": "application/json",
            },
            data,
        }
    );
    let repsonseJSON: any = {};
    // If it isn't a 2xx code, something wrong happened
    if (!response.statusCode.toString().startsWith("2")) {
        repsonseJSON = JSON.parse(response.content || "{}");
        repsonseJSON["serverError"] = true;
    } else {
        repsonseJSON = {
            issue: JSON.parse(response.content || "{}"),
            repository: repoName,
            serverError: false,
        };
    }
    return repsonseJSON;
}

export async function isRepositoryExist(
    http: IHttp,
    repoName: string,
    access_token?: string
): Promise<boolean> {
    let response;

    if (access_token) {
        response = await http.get(`${BaseRepoApiHost}${repoName}`, {
            headers: {
                Authorization: `token ${access_token}`,
                "Content-Type": "application/json",
            },
        });
    } else {
        response = await http.get(`${BaseRepoApiHost}${repoName}`, {
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    if (response.statusCode.toString().startsWith("2")) {
        return true;
    }

    return false;
}
