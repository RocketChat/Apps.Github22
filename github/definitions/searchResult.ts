//inidividual search result
export interface IGitHubSearchResult{
    result_id: string|number,
    title?: string,
    html_url?: string, 
    number?: string|number
    labels?: string,
    pull_request?: boolean, 
    pull_request_url?: string,
    user_login?:string,
    state?:string,
    share?:boolean,//true if seacrh result is to be shareed
    result: string,
}