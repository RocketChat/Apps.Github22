import { IGitHubSearchResult } from "./searchResult";

//search results for a user 
export interface IGitHubSearchResultData{
    user_id : string ,
    room_id : string,
    search_query : string,
    total_count? : string|number,
    search_results : Array<IGitHubSearchResult> 
}