import axios from 'axios';

class ActionProvider {
  constructor(createChatBotMessage, setStateFunc) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
  }

  handleAdoptionInquiry = () => {
    const message = this.createChatBotMessage("Sure! I can help with that.");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleSendMessage = async (userMessage, chatId) => {
    if (userMessage.trim() !== "") {
      try {
        await axios.post('http://localhost:5000/chatbot/message', {
          message: {
            chat: {
              id: chatId,
            },
            text: userMessage,
          },
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  handleButtonClick = (userMessage, chatId) => {
    this.handleSendMessage(userMessage, chatId);
  };
}

export default ActionProvider;
