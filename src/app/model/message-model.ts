export class MessageModel {
    userId?: string;
    userName?: string;
    message?: string;
    recipients?: string;
    recipientMap?: Map<string, string>;
    timestamp?: string;
    senderType?: string;
  
    constructor(
      userId?: string,
      userName?: string,
      message?: string,
      recipients?: string,
      recipientMap?: Map<string, string>,
      timestamp?: string,
      senderType?: string
    ) {
      this.userId = userId;
      this.userName = userName;
      this.message = message;
      this.recipients = recipients;
      this.recipientMap = recipientMap;
      this.timestamp = timestamp;
      this.senderType = senderType;
    }
  }
  