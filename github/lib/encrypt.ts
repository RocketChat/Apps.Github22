import { ICommandUsage } from "../enum/commands";


export function encoder(data: ICommandUsage[]): string[] {
    return data.map((item) => `${item.commandNumber}_${item.count}`);
}

export function decoder(data: string[]): ICommandUsage[] {
    return data.map((item) => {
        const [commandNumber, count] = item.split('_');
        return {
            commandNumber: parseInt(commandNumber),
            count: parseInt(count),
        };
    });
}