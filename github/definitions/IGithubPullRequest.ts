export interface IGitHubPullRequest{
    id: string|number,
    title?: string,
    html_url?: string,
    number?: string|number
    labels?: Array<string>,
    user_login?:string,
    user_avatar?:string,
    last_updated_at?: string,
    comments?:string|number,
    state?: string,
    assignees?: Array<string>,//user ids seperated by " "
    body?: string,
}
