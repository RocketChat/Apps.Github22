import { IHttp, HttpStatusCode, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { ModalsEnum } from "../enum/Modals";

class GitHubApi {
    private http: IHttp;
    private BaseHost: string;
    private BaseApiHost: string;
    private accessToken: String;

    constructor(http: IHttp, accessToken: String, BaseHost: string, BaseApiHost: string) {
        this.http = http;
        this.accessToken = accessToken;
        this.BaseApiHost = BaseApiHost;
        this.BaseHost = BaseHost;
    }

    private async getRequest(url: string): Promise<any> {
        const response = await this.http.get(url, {
            headers: {
                Authorization: `token ${this.accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.statusCode.toString().startsWith("2")) {
            throw response;
        }

        return JSON.parse(response.content || "{}");
    }

    public async getBasicUserInfo() {
        try {
            const response = await this.getRequest(
                this.BaseApiHost + 'user'
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
}

export { GitHubApi };
