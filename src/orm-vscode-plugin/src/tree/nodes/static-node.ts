/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import { RootNode } from './rootNode';
import { getResourcePath } from '../../utils/path-utils';
import path = require('path');

export interface NodeInfo {
  label: string,
  commandName: string,
  context: string,  
}

export class StaticNode extends RootNode {
  public compartmentId: string;

  constructor(nodeInfo: NodeInfo, iconPrefix: string, compartmentId: string) {
    super(
      `static${nodeInfo.label}Node-${compartmentId}`,
      nodeInfo.label,
      vscode.TreeItemCollapsibleState.Collapsed,
      getResourcePath(path.join('light', `${iconPrefix}-light.svg`)),
      getResourcePath(path.join('dark', `${iconPrefix}-dark.svg`)),
      nodeInfo.commandName,
      [],
      nodeInfo.context,
    );
    this.compartmentId = compartmentId;
  }
}
