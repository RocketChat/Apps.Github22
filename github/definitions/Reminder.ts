export interface IReminder {
    userid:string,
    username:string,
    repos: string[];
    unsubscribedPR:{repo:string,prnum:number[]}[]
}
