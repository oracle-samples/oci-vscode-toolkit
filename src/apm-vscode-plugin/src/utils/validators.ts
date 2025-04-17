/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { MonitorTypes, OnPremiseVantagePointWorkerType } from "oci-apmsynthetics/lib/model";

// returns true if string contains uppercase characters
export function hasUppercase(s: string): boolean {
    return (/[A-Z]/.test(s));
}

// returns true if string is empty (e.g. '')
export function isEmpty(s: string): boolean {
    return s?.trim() === '';
}

// returns true if string includes spaces (e.g. 'hello space')
export function hasSpaces(s: string): boolean {
    return s.includes(' ');
}

export function getSecondPart(str: String) {
    return str.split('-')[1];
}

export function validateFieldName(str: string) {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid field name';
    }
    return undefined;
}

export function validateMonitorName(str: string): string | undefined {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid monitor name';
    }
    return undefined;
}

export function validateOpvpName(str: string): string | undefined {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid on premise vantage point name';
    }
    return undefined;
}

export function validateOpvpDescription(str: string): string | undefined {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid on premise vantage point description';
    }
    return undefined;
}

export function validateWorkerName(str: string): string | undefined {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid worker name';
    }
    return undefined;
}

export function validateInstallationDir(str: string): string | undefined {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid installation directory path';
    }
    return undefined;
}

export function validateWorkerTarPath(str: string): string | undefined {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid worker tar path';
    }
    return undefined;
}

export function validateOpvpType(opvpType: string): string | undefined {
    if (isEmpty(opvpType) || Object.values(OnPremiseVantagePointWorkerType).includes(OnPremiseVantagePointWorkerType[opvpType as keyof typeof OnPremiseVantagePointWorkerType])) {
        return 'You must provide a valid opvp type';
    }
    return undefined;
}

// validates the ocid
export function validateOpvpId(str: string): string | undefined {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid opvp ocid';
    }
    return undefined;
}

// validates the ocid
export function validateWorkerId(str: string): string | undefined {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid worker ocid';
    }
    return undefined;
}

export function validateMonitorType(monitorType: string): string | undefined {
    if (isEmpty(monitorType) || Object.values(MonitorTypes).includes(MonitorTypes[monitorType as keyof typeof MonitorTypes])) {
        return 'You must provide a valid monitor type';
    }
    return undefined;
}

// validates the target
export function validateMonitorTarget(str: string): string | undefined {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid target value';
    }
    return undefined;
}

// validates the target
export function validateScriptId(str: string): string | undefined {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid Script OCID';
    }
    return undefined;
}

// validates the monitor interval
export function validateRepeatIntervalInSeconds(interval: any): string | undefined {
    if (interval > 900 || interval < 300) {
        return 'You must provide a valid interval value';
    }

    return undefined;
}

export function validateScriptName(str: string): string | undefined {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid script name';
    }
    return undefined;
}

export function validateTimestamp(str: string): string | undefined {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid timestamp';
    }
    return undefined;
}

export function validateDate(str: string): string | undefined {
    if (isEmpty(str)) {
        return 'You must provide a valid Date';
    }
    return undefined;
}
