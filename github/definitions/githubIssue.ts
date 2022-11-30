import { IGithubReactions } from "./githubReactions"

//inidividual issue
export interface IGitHubIssue{
    issue_id: string|number,
    title?: string,
    html_url?: string,
    number?: string|number
    labels?: Array<string>,
    user_login?:string,
    user_avatar?:string,
    last_updated_at?: string,
    comments?:string|number,
    state?: string,
    share?: boolean,//true if seacrh result is to be shareed
    assignees?: Array<string>,//user ids seperated by " "
    issue_compact: string,//compact string to share issues in rooms
    repo_url?: string,
    body?: string,
    reactions? : IGithubReactions
}
