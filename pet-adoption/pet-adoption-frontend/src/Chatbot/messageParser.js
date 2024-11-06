import axios from 'axios';

class MessageParser {
  constructor(actionProvider) {
    this.actionProvider = actionProvider;
  }

  async parse(message, chatId) {
    // Example of handling a specific intent
    // if (message.includes("adopt")) {
    //   this.actionProvider.handleAdoptionInquiry();
    // }

    // Send the message to the backend
    try {
      const response = await axios.post('http://localhost:5000/chatbot/message', {
        message: {
          chat: {
            id: chatId,
          },
          text: message,
        },
      });

      // Check if there is a reply from the backend
      if (response.data && response.data.reply) {
        const botMessage = this.actionProvider.createChatBotMessage(response.data.reply);
        this.actionProvider.setState((prev) => ({
          ...prev,
          messages: [...prev.messages, botMessage],
        }));
      }
    } catch (error) {
      console.error("Error sending message to backend:", error);
    }
  }
}

export default MessageParser;
