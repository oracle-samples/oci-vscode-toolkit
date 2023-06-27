/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as http from 'http';
import * as url from 'url';
import * as events from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Base64 } from 'js-base64';

import { getRealmName } from '../regions/fetch-regions';
import { IJwk } from '../keypair/jwk-keypair';

const tempHtml = `
<script type='text/javascript'>
hash = window.location.hash

// remove leading '#' so that python can detect it
if (hash[0] === '#') {
    hash = hash.substr(1)
}

console.log(hash)

function reqListener () {
    console.log(this.responseText);
    document.write('Authorization completed! Please close this window and return to Visual Studio Code to finish the sign-in process.')
}

var oReq = new XMLHttpRequest();
oReq.addEventListener("load", reqListener);
oReq.open("GET", "/token?" + hash);
oReq.send();
</script>`;

export class AuthServer extends events.EventEmitter {
    private readonly server: http.Server;
    private readonly portNumber: number = 8181;
    private started = false;

    constructor() {
        super();
        const self = this;

        this.server = http.createServer(
            (req: http.IncomingMessage, res: http.ServerResponse) => {
                if (req.url === '/') {
                    res.writeHead(200, { 'Content-type': 'text/html' });
                    res.end(tempHtml);
                } else {
                    if (req.url === undefined) {
                        return;
                    }
                    const query = url.parse(req.url.toString(), true).query;
                    self.emit('tokenReceived', query);
                    res.writeHead(200).end();
                }
            },
        );
    }

    // Starts the auth server
    public start(): void {
        this.server.listen(this.portNumber);
        this.started = true;
    }

    public isStarted(): boolean {
        return this.started;
    }

    public stop(): void {
        this.removeAllListeners('tokenReceived');
        this.server.close();
        this.started = false;
    }

    public getPortNumber(): number {
        return this.portNumber;
    }

    private getAuthUrl(region: string): string {
        const realm = getRealmName(region);
        return `https://login.${region}.${realm}/v1/oauth2/authorize`;
    }

    public createSignInUrl(region: string, jwk: IJwk): string {
        const queryKeys: { [key: string]: any } = {
            action: 'login',
            client_id: 'iaas_console',
            response_type: 'token+id_token',
            nonce: uuidv4(),
            scope: 'openid',
            public_key: Base64.encodeURI(JSON.stringify(jwk)),
            redirect_uri: `http://localhost:${this.getPortNumber()}`,
        };

        const queryString = Object.keys(queryKeys)
            .map(
                (k) =>
                    `${encodeURIComponent(k)}=${encodeURIComponent(
                        queryKeys[k],
                    ).replace(/%2B/g, '+')}`,
            )
            .join('&');
        return `${this.getAuthUrl(region)}?${queryString}`;
    }
}
