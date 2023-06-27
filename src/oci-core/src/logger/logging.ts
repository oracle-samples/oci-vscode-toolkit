/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

 import * as vscode from 'vscode';
 import { OutputChannel } from 'vscode';
 import { ILogger } from './logger';

  // function to retrieve logger using channelName
  export function getLogger(channelName: string){
    LOG.createLoggerChannel(channelName);
    return LOG.getLogInstance();
  }
 
  export class LOG implements ILogger{
     
     private static instance: LOG;
     private static outputChannelMap = new Map<string, OutputChannel>();
     private static loggerChannel: OutputChannel;
 
     private constructor() { }
 
      // function to create Output log channel for service teams
     public static createLoggerChannel(channelName: string): vscode.OutputChannel{
         const channel = LOG.outputChannelMap.get(channelName);
         if (!channel) { 
             LOG.outputChannelMap.set(channelName, vscode.window.createOutputChannel(channelName));
             LOG.loggerChannel = LOG.outputChannelMap.get(channelName)!;
         } else {
             LOG.loggerChannel =  channel;
         }
         return LOG.loggerChannel!;
     }
 
     // function to retrieve singleton instance of logger once initialized
     public static getLogInstance(): LOG {
         if (!LOG.instance) {
             LOG.instance = new LOG();
         }
         return LOG.instance;
     }
 
      debug(message: string, ...optionalParams: any[]): void {
          this.emitLog("debug", message, optionalParams);
      }
      info(message: string, ...optionalParams: any[]): void {
          this.emitLog("info", message, optionalParams);
      }
      warn(message: string, ...optionalParams: any[]): void {
          this.emitLog("warn", message, optionalParams);
      }
      error(message: string, ...optionalParams: any[]): void {
          this.emitLog("error", message, optionalParams);
      }
      trace(message: string, ...optionalParams: any[]): void {
          this.emitLog("trace", message, optionalParams);
      }
  
      private emitLog(messageType: string, message: string, optionalParams: any[] ){
          
          if(optionalParams.length > 0 ) {
             LOG.loggerChannel.appendLine(`${new Date().toISOString()} ${messageType}: ${message} : ${optionalParams}`);
             console.log(`${messageType}: ${message} : ${optionalParams}`);
          }
          else{
             LOG.loggerChannel.appendLine(`${new Date().toISOString()} ${messageType}: ${message}`);
              console.log(`${messageType}: ${message} `);
          }
      }
 
  }
