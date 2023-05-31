/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import stream = require("stream");

export async function streamToString(input: stream.Readable | ReadableStream): Promise<string> {
    if (input instanceof stream.Readable) {
        const chunks = [];
        for await (const chunk of input) {
            chunks.push(Buffer.from(chunk));
        }
        return Buffer.concat(chunks).toString("utf-8");
    } else {
        const chunks: any[] = [];
        const reader = input.getReader();
        while (true) {
            let chunk = await reader.read();
            if (chunk.done) {
                return Buffer.concat(chunks).toString("utf-8");
            }
            chunks.push(chunk.value);
        }
    }
}
