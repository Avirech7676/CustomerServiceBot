import { GoogleGenAI, Chat, Type, Tool, FunctionDeclaration } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// --- Tool Definitions ---

const trackOrderFunc: FunctionDeclaration = {
  name: "trackOrder",
  description: "Get the shipping status, location, and estimated delivery date of a customer order.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderId: {
        type: Type.STRING,
        description: "The order ID, e.g., ORD-123",
      },
    },
    required: ["orderId"],
  },
};

const checkStockFunc: FunctionDeclaration = {
  name: "checkStock",
  description: "Check if a product is in stock, its quantity, and its price in INR.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      productName: {
        type: Type.STRING,
        description: "The name of the product to check",
      },
    },
    required: ["productName"],
  },
};

const findServiceCenterFunc: FunctionDeclaration = {
  name: "findServiceCenter",
  description: "Find the address and contact details of a service center in a specific city.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      city: {
        type: Type.STRING,
        description: "The city name (e.g., Mumbai, Delhi, Bangalore)",
      },
    },
    required: ["city"],
  },
};

const toolsDef: Tool = {
  functionDeclarations: [trackOrderFunc, checkStockFunc, findServiceCenterFunc],
};

// --- Mock API Implementations ---

const mockAPIs: Record<string, (args: any) => any> = {
  trackOrder: ({ orderId }: { orderId: string }) => {
    // Deterministic mock data for demo
    const id = orderId.toUpperCase().replace('#', '');
    if (id === 'ORD-123') {
      return { status: 'In Transit', location: 'Hub Facility, Bhiwandi, Maharashtra', deliveryDate: '15th Nov' };
    } else if (id === 'ORD-456') {
      return { status: 'Delivered', location: 'Reception, Koramangala, Bangalore', deliveryDate: '10th Nov' };
    } else if (id.startsWith('ORD')) {
      return { status: 'Processing', location: 'Central Warehouse, Noida', deliveryDate: 'TBD' };
    } else {
      return { error: 'Order ID not found. Please ask the user to check their order number.' };
    }
  },
  checkStock: ({ productName }: { productName: string }) => {
    const lowerName = productName.toLowerCase();
    if (lowerName.includes('laptop') || lowerName.includes('book')) {
      return { product: 'Pro Series Laptop', stock: 42, status: 'In Stock', price: '₹94,999' };
    } else if (lowerName.includes('headphone') || lowerName.includes('audio')) {
      return { product: 'Sonic X Headphones', stock: 15, status: 'Low Stock', price: '₹2,499' };
    } else if (lowerName.includes('phone') || lowerName.includes('mobile')) {
      return { product: 'Phone Series 5', stock: 0, status: 'Out of Stock', restockDate: '1st Dec' };
    } else {
      return { product: productName, stock: 0, status: 'Unknown Item', note: 'Item not found in catalog.' };
    }
  },
  findServiceCenter: ({ city }: { city: string }) => {
    const lowerCity = city.toLowerCase();
    if (lowerCity.includes('mumbai')) {
      return { city: 'Mumbai', address: 'Shop 12, Phoenix Market City, Kurla, Mumbai', phone: '022-12345678', timing: '10 AM - 8 PM' };
    } else if (lowerCity.includes('delhi') || lowerCity.includes('noida')) {
      return { city: 'Delhi NCR', address: 'Sector 18, Noida Electronic City, UP', phone: '011-87654321', timing: '10 AM - 7 PM' };
    } else if (lowerCity.includes('bangalore') || lowerCity.includes('bengaluru')) {
      return { city: 'Bangalore', address: '100ft Road, Indiranagar, Bangalore', phone: '080-45671234', timing: '10 AM - 9 PM' };
    } else {
      return { city: city, status: 'No specific center found', advice: 'Please visit our nearest partner store or mail support@techsanju.in' };
    }
  }
};

/**
 * Creates a new chat session with the specific system instruction and tools.
 */
export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      tools: [toolsDef],
    },
  });
};

/**
 * Sends a message to the chat session, handles tool calls automatically, and yields text chunks.
 */
export async function* sendMessageStream(chat: Chat, message: string) {
  try {
    // Initial request
    let result = await chat.sendMessageStream({ message });
    
    // Loop to handle multi-turn tool interactions
    while (true) {
      const functionCalls: any[] = [];

      // Iterate through the stream
      for await (const chunk of result) {
        const text = chunk.text;
        // Yield text if present (e.g. "Let me check that for you...")
        if (text) {
          yield text;
        }
        
        // Collect function calls
        if (chunk.functionCalls) {
          functionCalls.push(...chunk.functionCalls);
        }
      }

      // If the model requested function calls, execute them
      if (functionCalls.length > 0) {
        const functionResponses = [];
        
        for (const call of functionCalls) {
          const { name, args, id } = call;
          console.log(`[Gemini] Calling tool: ${name}`, args);
          
          const apiFunction = mockAPIs[name];
          const response = apiFunction ? apiFunction(args) : { error: `Function ${name} not implemented` };
          
          functionResponses.push({
            functionResponse: {
              name: name,
              response: { result: response },
              id: id 
            }
          });
        }

        // Send the tool execution results back to the model
        // The model will generate a new response based on this data
        // IMPORTANT: We must pass the response as { message: parts }
        result = await chat.sendMessageStream({ message: functionResponses });
      } else {
        // If no function calls, we are done with this turn
        break;
      }
    }

  } catch (error) {
    console.error("Error in stream:", error);
    yield "\n\n*System Error: I'm having trouble accessing my tools right now.*";
    throw error;
  }
}