import {
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord
} from '@rocket.chat/apps-engine/definition/metadata';
import { decoder, encoder } from '../lib/encrypt';
import { ICommandUsage } from '../enum/commands';

const assoc = new RocketChatAssociationRecord(
    RocketChatAssociationModel.MISC,
    'analytics'
);



export async function AddAnalyticData(
    read: IRead,
    persistence: IPersistence,
    commandNumber: number,
): Promise<void> {
    const data = await getAnalyticData(read);

    if (data.length === 0) {
        const commandNumbers = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18
        ];
        const AnalyticsData = commandNumbers.map((command) => ({
            commandNumber: command,
            count: 0,
        })) as unknown as ICommandUsage[];


        const encodedData = encoder(AnalyticsData);

        await persistence.createWithAssociation(
            encodedData,
            assoc
        );
        return;
    } else {
        let decodedData = decoder(data);
        const command = decodedData.find((cmd) => cmd.commandNumber === commandNumber)
        if (command) {
            command.count++;
        }

        await persistence.updateByAssociation(assoc, encoder(decodedData));
    }

    return;
}

export async function getAnalyticData(read: IRead): Promise<string[]> {
    const data = await read.getPersistenceReader().readByAssociation(assoc);
    return data.length ? (data[0] as string[]) : [];
}
