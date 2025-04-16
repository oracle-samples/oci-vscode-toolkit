/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode         from 'vscode';
import { RootNode }        from './rootNode';
import { getResourcePath } from "../vscode_ext";

export interface NodeInfo {
  label: string,
  commandName: string,
  context: string,  
}

export class StaticNode extends RootNode {
  public parentId: string;

  constructor(nodeInfo: NodeInfo, iconPrefix: string, parent: RootNode) {
    super(
      `static${nodeInfo.label}Node-${parent.id}`,
      nodeInfo.label,
      vscode.TreeItemCollapsibleState.Collapsed,
      getResourcePath(`light/${iconPrefix}-light.svg`),
      getResourcePath(`dark/${iconPrefix}-dark.svg`),
      nodeInfo.commandName,
      nodeInfo.context,
      [],
      parent,
    );
    this.parentId = parent.id;
  }
}
