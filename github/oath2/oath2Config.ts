import { IOAuth2ClientOptions } from "@rocket.chat/apps-engine/definition/oauth2/IOAuth2";
import { GithubApp } from "../GithubApp";
import authorizationCallback from "./oath2callback"

export default function getOauth2Config(app:GithubApp):IOAuth2ClientOptions{
    let oauth2Config: IOAuth2ClientOptions = {
        alias: "github-app",
        accessTokenUri: "https://github.com/login/oauth/access_token",
        authUri: "https://github.com/login/oauth/authorize",
        refreshTokenUri: "https://github.com/login/oauth/access_token",
        revokeTokenUri: "https://github.com/login/oauth/access_token",
        authorizationCallback: authorizationCallback.bind(app),
        defaultScopes: ["users", "repo"],
    };
    return oauth2Config;
}

