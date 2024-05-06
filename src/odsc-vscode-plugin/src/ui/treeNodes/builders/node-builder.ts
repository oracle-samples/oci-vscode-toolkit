/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { IOCIResource } from '../../../api/oci/resourceinterfaces/ioci-resource';

export function makeSubnodes<NodeType>(listCall: () => Promise<IOCIResource[]>,
                                       nodeType: { new(resource: IOCIResource): NodeType })
         : Thenable<NodeType[]> {
    return listCall().then(items => Promise.all(items.map(item => new nodeType(item))));
}   
