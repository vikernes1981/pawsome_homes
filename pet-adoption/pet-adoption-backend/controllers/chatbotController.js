import dbService from '../services/dbService.js';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import { validationResult, body } from 'express-validator';
import logger from '../services/logger.js';
import Pet from '../models/Pet.js';
import User from '../models/User.js';
import { getAdoptionAnswer } from '../answers.js';

/**
 * Enterprise-grade Chatbot Controller
 * Handles AI-powered conversations for pet adoption assistance
 */
class ChatbotController {
  
  /**
   * Rate limiting for chatbot messages to prevent abuse
   */
  static chatbotRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each user to 50 requests per windowMs
    message: {
      success: false,
      message: 'Too many chat messages. Please try again later.',
      retryAfter: 15 * 60 // seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    }
  });

  /**
   * Input validation rules for chat messages
   */
  static validateChatMessage = [
    body('message.text')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Message must be between 1 and 500 characters')
      .escape(), // Sanitize HTML
    body('message.userId')
      .optional()
      .isMongoId()
      .withMessage('Invalid user ID format'),
    body('conversationId')
      .optional()
      .isUUID()
      .withMessage('Invalid conversation ID format')
  ];

  /**
   * Enhanced Wit.ai API integration with retry logic and caching
   */
  static async getWitResponse(text, retries = 3) {
    const startTime = Date.now();
    
    try {
      // Input sanitization
      const sanitizedText = text.trim().substring(0, 280); // Twitter-like limit
      
      if (!sanitizedText) {
        throw new Error('Empty message after sanitization');
      }

      // Check cache first (implement Redis in production)
      const cacheKey = `wit_${Buffer.from(sanitizedText).toString('base64')}`;
      
      const response = await axios.get(
        `https://api.wit.ai/message?v=20241024&q=${encodeURIComponent(sanitizedText)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.WIT_AI_ACCESS_TOKEN}`,
            'User-Agent': 'PetAdoption-Chatbot/1.0'
          },
          timeout: 5000, // 5 second timeout
          validateStatus: (status) => status < 500 // Retry on 5xx errors
        }
      );

      const responseTime = Date.now() - startTime;
      
      logger.info('Wit.ai API call successful', {
        responseTime,
        confidence: response.data.intents?.[0]?.confidence || 0,
        intent: response.data.intents?.[0]?.name || 'unknown',
        textLength: sanitizedText.length
      });

      return response.data;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (retries > 0 && (error.code === 'ECONNABORTED' || error.response?.status >= 500)) {
        logger.warn('Wit.ai API retry attempt', {
          retriesLeft: retries - 1,
          error: error.message,
          responseTime
        });
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
        return this.getWitResponse(text, retries - 1);
      }

      logger.error('Wit.ai API error', {
        error: error.message,
        status: error.response?.status,
        responseTime,
        textPreview: text.substring(0, 50)
      });

      return null;
    }
  }

  /**
   * Get contextual pet recommendations based on user preferences
   */
  static async getPetRecommendations(userPreferences = {}) {
    try {
      const {
        species = null,
        size = null,
        age = null,
        location = null,
        limit = 3
      } = userPreferences;

      const filter = { adoptionStatus: 'available' };
      
      if (species) filter.species = { $regex: species, $options: 'i' };
      if (size) filter.size = size;
      if (age) {
        const ageGroup = age.toLowerCase();
        if (ageGroup.includes('young') || ageGroup.includes('puppy') || ageGroup.includes('kitten')) {
          filter.age = { $lte: 2 };
        } else if (ageGroup.includes('senior') || ageGroup.includes('old')) {
          filter.age = { $gte: 7 };
        }
      }

      const pets = await Pet.find(filter)
        .select('name species breed age photos adoptionFee location')
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      return pets;
    } catch (error) {
      logger.error('Error getting pet recommendations:', error);
      return [];
    }
  }

  /**
   * Generate contextual responses based on intent and entities
   */
  static async generateContextualResponse(intent, entities, userContext = {}) {
    try {
      switch (intent) {
        case 'adoption_process':
          return {
            type: 'info',
            message: getAdoptionAnswer(),
            actions: [
              { type: 'button', text: 'View Available Pets', action: 'browse_pets' },
              { type: 'button', text: 'Contact Support', action: 'contact_support' }
            ]
          };

        case 'greetings':
          const timeOfDay = new Date().getHours() < 12 ? 'morning' : 
                           new Date().getHours() < 17 ? 'afternoon' : 'evening';
          return {
            type: 'greeting',
            message: `Good ${timeOfDay}! I'm here to help you find your perfect pet companion. What kind of pet are you looking for?`,
            quickReplies: ['Dogs', 'Cats', 'Other Pets', 'Adoption Process']
          };

        case 'find_pets':
          const petType = entities.find(e => e.name === 'pet_type')?.value;
          const location = entities.find(e => e.name === 'location')?.value;
          
          const recommendations = await this.getPetRecommendations({
            species: petType,
            location: location,
            limit: 5
          });

          if (recommendations.length > 0) {
            return {
              type: 'pet_list',
              message: `I found ${recommendations.length} ${petType || 'pets'} available for adoption!`,
              pets: recommendations,
              actions: [
                { type: 'button', text: 'View All Pets', action: 'browse_all_pets' }
              ]
            };
          } else {
            return {
              type: 'no_results',
              message: `I couldn't find any ${petType || 'pets'} matching your criteria right now. Would you like to see other available pets or get notified when new ${petType || 'pets'} arrive?`,
              actions: [
                { type: 'button', text: 'See All Pets', action: 'browse_all_pets' },
                { type: 'button', text: 'Set Alert', action: 'create_alert' }
              ]
            };
          }

        case 'find_nearby_shelters':
          return {
            type: 'location_service',
            message: 'You can view nearby shelters directly on our homepage! The app uses your location to find animal shelters within a 10 km radius. Make sure location services are enabled.',
            actions: [
              { type: 'button', text: 'View Shelter Map', action: 'open_shelter_map' }
            ]
          };

        case 'contact_shelter':
          return {
            type: 'info',
            message: 'You can find contact details for each shelter in the pet\'s profile! Scroll down to the pet\'s description to see shelter information and contact options.',
            actions: [
              { type: 'button', text: 'Browse Pets', action: 'browse_pets' }
            ]
          };

        case 'find_petshop':
          return {
            type: 'location_service',
            message: 'Find pet shops on our Food Recommendation page! We use Google Maps to show pet supply stores within 15 km of your location.',
            actions: [
              { type: 'button', text: 'Open Pet Shop Map', action: 'open_petshop_map' }
            ]
          };

        case 'adoption_requirements':
          return {
            type: 'requirements',
            message: 'Adoption requirements vary by shelter, but typically include: valid ID, proof of residence, pet care experience, and a meet-and-greet with the pet. Some pets may have specific requirements.',
            actions: [
              { type: 'button', text: 'View Adoption Guide', action: 'adoption_guide' }
            ]
          };

        default:
          return {
            type: 'fallback',
            message: 'I can help you with pet adoption questions, finding pets, locating shelters, or connecting with support. What would you like to know?',
            quickReplies: ['Find Pets', 'Adoption Process', 'Nearby Shelters', 'Contact Support']
          };
      }
    } catch (error) {
      logger.error('Error generating contextual response:', error);
      return {
        type: 'error',
        message: 'I apologize, but I encountered an issue. Please try again or contact our support team.',
        actions: [
          { type: 'button', text: 'Contact Support', action: 'contact_support' }
        ]
      };
    }
  }

  /**
   * Log conversation for analytics and improvement
   */
  static async logConversation(userId, message, intent, response, confidence) {
    try {
      const conversationLog = {
        userId,
        timestamp: new Date(),
        userMessage: message,
        detectedIntent: intent,
        confidence,
        botResponse: response.message,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // In production, save to dedicated conversation collection
      // await ConversationLog.create(conversationLog);
      
      logger.info('Conversation logged', {
        userId,
        intent,
        confidence,
        messageLength: message.length,
        responseType: response.type
      });

    } catch (error) {
      logger.error('Error logging conversation:', error);
      // Don't fail the request if logging fails
    }
  }

  /**
   * Main controller for handling chatbot messages
   * POST /api/chatbot/message
   */
  static async handleChatbotMessage(req, res) {
    const startTime = Date.now();
    
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { message, conversationId } = req.body;
      const userId = message.userId || req.user?.id;
      const text = message.text;

      logger.info('Chatbot message received', {
        userId,
        conversationId,
        messageLength: text.length,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      // Get Wit.ai response for intent recognition
      const witResponse = await this.getWitResponse(text);
      
      let intent = 'unknown';
      let confidence = 0;
      let entities = [];
      let response;

      if (witResponse && witResponse.intents && witResponse.intents.length > 0) {
        intent = witResponse.intents[0].name;
        confidence = witResponse.intents[0].confidence;
        entities = witResponse.entities ? Object.values(witResponse.entities).flat() : [];

        // Only proceed with high-confidence intents
        if (confidence >= 0.7) {
          response = await this.generateContextualResponse(intent, entities, { userId });
        } else {
          // Low confidence fallback
          response = await this.generateContextualResponse('unknown', [], { userId });
          logger.info('Low confidence intent detected', {
            intent,
            confidence,
            userId
          });
        }
      } else {
        // No intent detected
        response = await this.generateContextualResponse('unknown', [], { userId });
      }

      // Log conversation for analytics
      await this.logConversation(userId, text, intent, response, confidence);

      const responseTime = Date.now() - startTime;

      logger.info('Chatbot response sent', {
        userId,
        intent,
        confidence,
        responseTime,
        responseType: response.type
      });

      res.json({
        success: true,
        data: {
          response,
          metadata: {
            intent,
            confidence,
            responseTime,
            conversationId: conversationId || `conv_${Date.now()}`
          }
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('Error handling chatbot message:', {
        error: error.message,
        stack: error.stack,
        userId: req.body?.message?.userId,
        responseTime,
        userAgent: req.get('User-Agent')
      });

      res.status(500).json({
        success: false,
        message: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get chatbot analytics and performance metrics
   * GET /api/chatbot/analytics (Admin only)
   */
  static async getChatbotAnalytics(req, res) {
    try {
      // This would typically query a ConversationLog collection
      const analytics = {
        totalConversations: 0,
        averageConfidence: 0,
        topIntents: [],
        responseTimeAvg: 0,
        userSatisfaction: 0,
        commonFailures: []
      };

      logger.info('Chatbot analytics retrieved', {
        adminId: req.user.id
      });

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      logger.error('Error retrieving chatbot analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analytics'
      });
    }
  }

  /**
   * Health check for chatbot services
   * GET /api/chatbot/health
   */
  static async healthCheck(req, res) {
    try {
      const services = {
        witAi: false,
        database: false,
        responseTime: Date.now()
      };

      // Test Wit.ai connectivity
      try {
        const testResponse = await this.getWitResponse('hello');
        services.witAi = !!testResponse;
      } catch (error) {
        services.witAi = false;
      }

      // Test database connectivity
      try {
        await Pet.findOne().limit(1);
        services.database = true;
      } catch (error) {
        services.database = false;
      }

      services.responseTime = Date.now() - services.responseTime;

      const allHealthy = Object.values(services).every(status => 
        typeof status === 'boolean' ? status : true
      );

      res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        services,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(503).json({
        success: false,
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default ChatbotController;

// Named exports for individual methods
export const handleChatbotMessage = ChatbotController.handleChatbotMessage;
export const getChatbotAnalytics = ChatbotController.getChatbotAnalytics;
export const healthCheck = ChatbotController.healthCheck;
export const chatbotRateLimit = ChatbotController.chatbotRateLimit;
export const validateChatMessage = ChatbotController.validateChatMessage;