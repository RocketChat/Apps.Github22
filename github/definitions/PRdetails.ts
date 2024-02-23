export interface IPRdetail{
    title: string;
    number:string;
    url: string;
    id: string;
    createdAt: Date; 
    ageInDays?:number;
    author: { avatar: string; username: string; };repo:string; 
 }