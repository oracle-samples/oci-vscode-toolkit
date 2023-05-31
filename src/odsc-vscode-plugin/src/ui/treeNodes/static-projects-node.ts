/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { ProjectsItem }   from '../commands/resources';
import { OCIProjectNode } from './oci-project-node';
import * as dataScience   from "../../api/oci/data-science";
import { StaticNode }     from './static-node';
import { ext }            from '../../extensionVars';
import * as nodeBuilder   from "./builders/node-builder";
import { OCICompartmentNode } from './oci-compartment-node';

export class ProjectsNode extends StaticNode {
  constructor(compartment: OCICompartmentNode) {
    super(ProjectsItem, 'each-project', compartment);
  }

  getChildren(_element: any): Thenable<OCIProjectNode[]> {
    return nodeBuilder.makeSubnodes(
      () => dataScience.listProjects(this.parentId),
      OCIProjectNode,
    );
  }
}
