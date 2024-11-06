import dbService from "../services/dbService.js";
import axios from "axios";
import { getAdoptionAnswer } from "../answers.js";

// Get Wit.ai response
const getWitResponse = async (text) => {
  try {
    const response = await axios.get(
      `https://api.wit.ai/message?v=20241024&q=${encodeURIComponent(text)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WIT_AI_ACCESS_TOKEN}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error with Wit.ai API:", error);
    return null;
  }
};

// Main controller for handling chatbot messages
export const handleChatbotMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.sendStatus(400);
    }

    const userId = message.userId;
    const text = message.text;

    // Fetch the Wit.ai response for intent recognition
    const witResponse = await getWitResponse(text);

    if (witResponse && witResponse.intents && witResponse.intents.length > 0) {
      const intent = witResponse.intents[0].name;

      // Respond based on detected intent
      if (intent === "adoption_proccess") {
        const answer = getAdoptionAnswer();
        res.json({ reply: answer });
      } else if (intent === "answers_greetings") {
        res.json({ reply: "Hello! How can I assist you today?" });
      } else if (intent === "find_nearby_shelters") {
        res.json({
          reply:
            "You can view nearby shelters directly on our homepage! The app uses your location to find animal shelters within a 10 km radius. Make sure location services are enabled, and the map will show shelters around you. Just tap on a shelter for more details!",
        });
      } else if (intent === "contact_shelter") {
        res.json({
          reply:
            "You can find the contact details for each shelter directly in the pet's profile! Just scroll down to the pet’s description, and you’ll see a link with shelter details right underneath. Tap the link to get more information about the shelter.",
        });
      } else if (intent === "find_petshop") {
        res.json({
          reply:
            "You can find pet shops near you on our Food Recommendation page! The app uses Google Maps to show pet supply stores within a 15 km radius of your location. Just head to the Food Recommendation section, and the map will display all the nearby pet shops for you!",
        });
      } else {
        res.json({ reply: "Hello! How can I assist you today?" });
      }
      
    } else {
      // No recognized intent from Wit.ai
      res.json({
        reply:
          "I'm not sure how to respond to that. Could you ask something else?",
      });
    }
  } catch (error) {
    console.error("Error handling chatbot message:", error);
    res.sendStatus(500);
  }
};
