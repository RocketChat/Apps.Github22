import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { UserInformation } from "../definitions/Userinfo";
import { ModalsEnum } from "../enum/Modals";
import { IGitHubIssue } from "../definitions/githubIssue";
import { AppSettingsEnum } from "../settings/settings";
import { getAccessTokenForUser } from "../persistance/auth";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { GithubApp } from "../GithubApp";
import { IAuthData } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";

class GitHubApi {
    private static instance: GitHubApi;
    private http: IHttp;
    private BaseHost: string;
    private BaseApiHost: string;
    private accessToken: IAuthData | undefined;

    constructor(http: IHttp) {
        this.http = http;
    }

    private async initialize(
        read: IRead,
        user: IUser,
        app: GithubApp
    ): Promise<void> {
        const environmentReader = read.getEnvironmentReader();
        this.BaseHost = await environmentReader
            .getSettings()
            .getValueById(AppSettingsEnum.BaseHostID);
        this.BaseApiHost = await environmentReader
            .getSettings()
            .getValueById(AppSettingsEnum.BaseApiHostID);

        this.accessToken = await getAccessTokenForUser(
            read,
            user,
            app.oauth2Config
        );
    }

    public static async getInstance(
        http: IHttp,
        read: IRead,
        user: IUser,
        app: GithubApp
    ): Promise<GitHubApi> {
        if (!GitHubApi.instance) {
            GitHubApi.instance = new GitHubApi(http);
            await GitHubApi.instance.initialize(read, user, app);
        }
        return GitHubApi.instance;
    }

    private async getRequest(url: string): Promise<any> {
        const response = await this.http.get(this.BaseApiHost + url, {
            headers: {
                "Content-Type": "application/json",
                ...(this.accessToken && {
                    Authorization: `token ${this.accessToken}`,
                }),
            },
        });

        if (!response.statusCode.toString().startsWith("2")) {
            throw response;
        }

        return JSON.parse(response.content || "{}");
    }

    public async getBasicUserInfo(): Promise<UserInformation> {
        try {
            const response = await this.getRequest("user");
            return {
                username: response.login,
                name: response.name,
                email: response.email,
                bio: response.bio,
                followers: response.followers,
                following: response.following,
                avatar: response.avatar_url,
            };
        } catch (error) {
            throw error;
        }
    }

    public async getIssueTemplates(repoName: string) {
        try {
            const response = await this.getRequest(
                `repos/${repoName}/contents/.github/ISSUE_TEMPLATE`
            );
            return {
                templates: JSON.parse(response.content || "{}"),
                repository: repoName,
                template_not_found: false,
            };
        } catch (error) {
            return {
                template_not_found: true,
            };
        }
    }

    public async getIssueTemplateCode(templateDownloadUrl: string) {
        try {
            const response = await this.getRequest(templateDownloadUrl);
            return {
                template: response.content || "",
            };
        } catch (error) {
            return {
                template: "",
            };
        }
    }

    public async getUserAssignedIssues(
        username: String,
        filter: {
            filter: String;
            state: String;
            sort: String;
        }
    ): Promise<IGitHubIssue[]> {
        let url: string = "";
        switch (filter.filter) {
            case ModalsEnum.CREATED_ISSUE_FILTER:
                url = `https://api.github.com/search/issues?q=is:${
                    filter.state
                }+is:issue+sort:${filter.sort.substring(
                    5
                )}-desc+author:${username}`;
                break;
            case ModalsEnum.ASSIGNED_ISSUE_FILTER:
                url = `https://api.github.com/search/issues?q=is:${
                    filter.state
                }+is:issue+sort:${filter.sort.substring(
                    5
                )}-desc+assignee:${username}`;
                break;
            case ModalsEnum.MENTIONED_ISSUE_FILTER:
                url = `https://api.github.com/search/issues?q=is:${
                    filter.state
                }+is:issue+sort:${filter.sort.substring(
                    5
                )}-desc+mentions:${username}`;
            default:
                break;
        }

        try {
            const response = await this.getRequest(url);

            const getAssignees = (assignees: any[]): string[] =>
                assignees.map((val): string => {
                    return val.login as string;
                });

            const modifiedResponse: Array<IGitHubIssue> = response.items.map(
                (value): IGitHubIssue => {
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
                    };
                }
            );

            return modifiedResponse;
        } catch (e) {
            return [];
        }
    }

    public async getIssueData(
        repoInfo: String,
        issueNumber: String
    ): Promise<IGitHubIssue> {
        try {
            const response = await this.getRequest(
                `repos/${repoInfo}/issues/${issueNumber}`
            );

            const getAssignees = (assignees: any[]): string[] =>
                assignees.map((val): string => {
                    return val.login as string;
                });

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
                    eyes: response.reactions["eyes"],
                },
            };
        } catch (error) {
            return {
                issue_compact: "Error Fetching Issue",
                issue_id: 0,
            };
        }
    }

    public async getIssuesComments(
        repoName: string,
        issueNumber: string | number
    ) {
        try {
            const response = await this.getRequest(
                `repos/${repoName}/issues/${issueNumber}/comments`
            );
            return {
                data: response,
                serverError: false,
            };
        } catch (error) {
            return {
                serverError: true,
                ...error,
            };
        }
    }

    public async getRepositoryIssues(repoName: string) {
        try {
            const response = await this.getRequest(`repos/${repoName}/issues`);
            return {
                issues: response,
                repository: repoName,
                serverError: false,
            };
        } catch (error) {
            return {
                serverError: true,
                ...error,
            };
        }
    }
}

export { GitHubApi };
