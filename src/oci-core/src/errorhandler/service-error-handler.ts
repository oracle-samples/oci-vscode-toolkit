/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { OciError } from "oci-common/lib/error";
import { OciExtensionError } from "./oci-plugin-error";
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function handleServiceError(errorMessage: string, exception: OciError) {
    const message: string = await constructMessage(errorMessage, exception);
    throw new OciExtensionError(message, exception.statusCode, exception);
}

export const check_policy_message = localize("checkPolicyMessage", "Please check if resource exists and has proper policy setup under tenancy");

export async function constructMessage(errorMessage: string, exception: OciError): Promise<string> {
    let message: string = `${errorMessage} ${exception.message}`;
    if (exception.statusCode === 404 && exception.serviceCode === 'NotAuthorizedOrNotFound') {
        message = `${exception.message}. ${check_policy_message}`;
    }
    return message;
}
