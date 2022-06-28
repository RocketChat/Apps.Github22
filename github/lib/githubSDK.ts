import { IHttp } from '@rocket.chat/apps-engine/definition/accessors';

const BaseHost = 'https://github.com/';
const BaseApiHost = 'https://api.github.com/repos/';

export class GithubSDK {
    constructor(private readonly http: IHttp, private readonly accessToken) {}

    public createWebhook(repoName: string, webhookUrl: string) {
        return this.post(BaseApiHost + repoName + '/hooks', {
            active: true,
            events: ['push'],
            config: {
              url: webhookUrl,
              content_type: 'json',
            },
        });
    }

    private async post(url: string, data: any): Promise<any> {
        const response = await this.http.post(url, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Rocket.Chat-Apps-Engine',
            },
            data,
        });

        // If it isn't a 2xx code, something wrong happened
        if (!response.statusCode.toString().startsWith('2')) {
            throw response;
        }

        return JSON.parse(response.content || '{}');
    }
}