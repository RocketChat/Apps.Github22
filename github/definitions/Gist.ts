import { IGistFile } from "./GistFile";

export interface IGist {
    id : string,
    html_url : string,
    updated_at : string,
    description : string,
    owner_login : string,
    owner_avatar : string,
    files : any
}
