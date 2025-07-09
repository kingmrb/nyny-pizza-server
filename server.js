const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ============================================
// NYNY PIZZA SERVER - VERSION 53.2
// Last Updated: January 2025
// Changes: Fixed combo detection and all modifications tracking
// ============================================

const app = express();
const port = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TOAST_API_URL = process.env.TOAST_API_URL;
const TOAST_API_KEY = process.env.TOAST_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Add this to your .env file

app.use(bodyParser.json({ limit: '10mb' }));

// Complete menu with size-aware pricing
const MENU_ITEMS = {
  // Build Your Own Pizza
  "build your own pizza 14": 15,
  "build your own pizza 18": 20,
  "build your own pizza": 15,
  
  // Specialty Pizzas
  "margherita pizza 14": 19,
  "margherita pizza 18": 24,
  "margherita pizza": 19,
  
  "white pizza 14": 19,
  "white pizza 18": 24,
  "white pizza": 19,
  
  "four cheese pizza 14": 19,
  "four cheese pizza 18": 24,
  "four cheese pizza": 19,
  
  "grandma pie 14": 19,
  "grandma pie 18": 24,
  "grandma pie": 19,
  
  "florentine pizza 14": 19,
  "florentine pizza 18": 24,
  "florentine pizza": 19,
  
  "little italy pizza 14": 19,
  "little italy pizza 18": 24,
  "little italy pizza": 19,
  
  "veggie pizza 14": 19,
  "veggie pizza 18": 24,
  "veggie pizza": 19,
  
  "philly steak pizza 14": 19,
  "philly steak pizza 18": 24,
  "philly steak pizza": 19,
  
  "hawaiian pizza 14": 19,
  "hawaiian pizza 18": 24,
  "hawaiian pizza": 19,
  
  "buffalo chicken pizza 14": 19,
  "buffalo chicken pizza 18": 24,
  "buffalo chicken pizza": 19,
  
  "chicken alfredo pizza 14": 19,
  "chicken alfredo pizza 18": 24,
  "chicken alfredo pizza": 19,
  
  "bbq chicken pizza 14": 19,
  "bbq chicken pizza 18": 24,
  "bbq chicken pizza": 19,
  
  "meat lovers pizza 14": 19,
  "meat lovers pizza 18": 24,
  "meat lovers pizza": 19,
  
  "ny ny supreme 14": 19,
  "ny ny supreme 18": 24,
  "ny ny supreme": 19,
  
  "sicilian": 21.5,
  
  // Appetizers
  "fried mozzarella sticks": 8,
  "fried mushrooms": 8,
  "fried mac & cheese balls": 8,
  "jalapeno poppers": 8,
  "fried zucchini": 8,
  "chicken tenders": 11,
  "meatballs 2pc": 8,
  "meatballs 4pc": 12,
  "meatballs": 8,
  "seasoned french fries": 6,
  "garlic knots 2pc": 3,
  "garlic knots 6pc": 6,
  "garlic knots": 3,
  "garlic bread": 6,
  "manhattan rolls": 8,
  
  // Wings
  "buffalo wings 6": 10,
  "buffalo wings 10": 16,
  "buffalo wings 20": 30,
  "buffalo wings 30": 45,
  "wings 6": 10,
  "wings 10": 16,
  "wings 20": 30,
  "wings 30": 45,
  "wings": 16,
  
  // Salads
  "garden salad": 9,
  "caesar salad": 9,
  "chef salad": 12,
  "antipasto salad": 12,
  "greek salad": 12,
  
  // Subs
  "philly cheese": 13,
  "meatball parmigiana": 13,
  "vodka chicken": 15,
  "chicken parm": 13,
  "chicken cutlet": 13,
  "eggplant parm": 13,
  "ham & cheese": 13,
  "salami & cheese": 13,
  "turkey & cheese": 13,
  "italian combo": 13,
  
  // Specialties
  "stromboli": 13,
  "calzone": 13,
  "uncle raymond's meaty": 10,
  "uncle fred's florentine": 10,
  
  // Pasta
  "marinara pasta": 11,
  "meatballs pasta": 13,
  "meat sauce pasta": 13,
  "penne a la vodka": 14,
  "fettuccine alfredo": 14,
  "chicken parmigiana pasta": 16,
  "stuffed shells": 12,
  "baked ziti": 12,
  "meat lasagna": 15,
  "pasta combo": 15,
  "eggplant florentine": 16,
  
  // Desserts
  "cheesecake": 6,
  "cannoli": 6,
  "chocolate cake": 6,
  "zeppoles": 6
};

// Topping prices
const TOPPING_PRICES = {
  "14": { "regular": 2.00, "premium": 2.50 },
  "18": { "regular": 3.00, "premium": 3.50 }
};

const REGULAR_TOPPINGS = [
  'pepperoni', 'ham', 'sausage', 'salami', 
  'peppers', 'pepper', // Both forms
  'red-roasted peppers', 'red roasted peppers', 'roasted red peppers',
  'onions', 'onion', // Both forms  
  'pineapple', 'pineapples', // Both forms
  'mushrooms', 'mushroom', // Both forms
  'eggplant', 'olives', 'olive', // Both forms
  'fresh basil', 'basil', 'spinach', 
  'banana peppers', 'banana pepper', // Both forms
  'garlic', 'garlics', // Both forms - added plural
  'jalapeño', 'jalapeno', 'jalapeños', 'jalapenos',
  'tomatoes', 'tomato',
  'diced tomatoes'
];

const PREMIUM_TOPPINGS = [
  'bacon', 'steak', 'chicken', 'meatball', 'meatballs', // Both forms
  'mozzarella', 'fresh mozzarella', 'feta', 'extra cheese', 'cheese'
];

const QUANTITY_WORDS = { 
  one: 1, two: 2, three: 3, four: 4, five: 5, 
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10 
};

const TAX_RATE = 0.065;

// Item mappings
const ITEM_MAPPINGS = {
  // Pizzas
  'build your own': 'build your own pizza',
  'custom': 'build your own pizza',
  'custom pizza': 'build your own pizza',
  'margherita': 'margherita pizza',
  'margherita pizza': 'margherita pizza',
  'margheritas': 'margherita pizza', // Added plural
  'margaritas': 'margherita pizza', // Common transcription variation
  'white': 'white pizza',
  'white pizza': 'white pizza',
  'four cheese': 'four cheese pizza',
  'cheese pizza': 'four cheese pizza',
  'grandma pie': 'grandma pie',
  'grandma': 'grandma pie',
  'grandma pies': 'grandma pie', // Added plural
  'florentine pizza': 'florentine pizza',
  'little italy': 'little italy pizza', // Added without "pizza"
  'little italy pizza': 'little italy pizza',
  'veggie pizza': 'veggie pizza',
  'hawaiian pizza': 'hawaiian pizza',
  'buffalo chicken pizza': 'buffalo chicken pizza',
  'chicken alfredo pizza': 'chicken alfredo pizza',
  'bbq chicken pizza': 'bbq chicken pizza',
  'bbq chicken': 'bbq chicken pizza',
  'barbecue chicken': 'bbq chicken pizza',
  'barbecue chicken pizza': 'bbq chicken pizza',
  'meat lovers': 'meat lovers pizza', // Added without "pizza"
  'meat lovers pizza': 'meat lovers pizza',
  'ny ny supreme': 'ny ny supreme',
  'supreme': 'ny ny supreme',
  'sicilian': 'sicilian',
  
  // Appetizers
  'mozzarella sticks': 'fried mozzarella sticks',
  'french fries': 'seasoned french fries',
  'fries': 'seasoned french fries',
  'sides of fries': 'seasoned french fries',
  'seasoned french fries': 'seasoned french fries',
  
  // Salads
  'caesar salad': 'caesar salad',
  'garden salad': 'garden salad',
  'seedless salad': 'caesar salad', // Common transcription error for "caesar salad"
  
  // Subs
  'philly cheese': 'philly cheese',
  'philly cheesesteak': 'philly cheese',
  'philly cheese steak': 'philly cheese',
  'cheesesteak': 'philly cheese',
  'philly cheesesteaks': 'philly cheese',
  'philly cheese sandwiches': 'philly cheese', // Added plural form
  'philly cheese sandwich': 'philly cheese',
  
  // Desserts
  'new york cheesecake': 'cheesecake',
  'new york cheesecakes': 'cheesecake',
  'ny cheesecake': 'cheesecake'
};

// AI-powered order summarization function
async function summarizeOrderWithAI(orderText) {
  if (!OPENAI_API_KEY) {
    console.log('⚠️ OpenAI API key not configured, using fallback parsing');
    return null;
  }

  try {
    const prompt = `You are a pizza restaurant order parser. Parse ONLY the items listed in this order confirmation.

Menu items to use:
PIZZAS (always include size 14 or 18):
- Build Your Own Pizza
- Margherita Pizza  
- Little Italy Pizza
- Meat Lovers Pizza
- Hawaiian Pizza
- Buffalo Chicken Pizza
- BBQ Chicken Pizza
- Veggie Pizza
- NY NY Supreme
- Philly Steak Pizza
- White Pizza
- Four Cheese Pizza
- Grandma Pie
- Florentine Pizza
- Chicken Alfredo Pizza
- Sicilian

SALADS:
- Garden Salad
- Caesar Salad
- Greek Salad
- Chef Salad
- Antipasto Salad

SUBS:
- Philly Cheese
- Meatball Parmigiana
- Chicken Parm
- Ham & Cheese
- Salami & Cheese

APPETIZERS:
- Seasoned French Fries
- Garlic Knots
- Meatballs
- Garlic Bread

Order text to parse:
"${orderText}"

Return a JSON array with this EXACT format (size as number, not string):
[
  {
    "quantity": 2,
    "item": "Little Italy Pizza",
    "size": 18,
    "modifications": []
  }
]

Rules:
- Size MUST be a number (14 or 18), not "18-inch" or "18\\""
- For "little italy pizzas" → "Little Italy Pizza"
- Include all modifications/toppings in the modifications array
- Parse ONLY what's listed, ignore any trailing text like "is there anything else"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response:', data);
      return null;
    }

    const parsedOrder = JSON.parse(data.choices[0].message.content);
    
    console.log('🤖 AI Parsed Order:', JSON.stringify(parsedOrder, null, 2));
    return parsedOrder;
  } catch (error) {
    console.error('❌ AI summarization error:', error);
    return null;
  }
}

// Convert AI parsed order to items array
function convertAIParsedToItems(parsedOrder) {
  const items = [];
  
  for (const orderItem of parsedOrder) {
    let itemName = orderItem.item.toLowerCase();
    let size = orderItem.size;
    let quantity = orderItem.quantity || 1;
    let modifications = orderItem.modifications || [];
    
    console.log(`\n🔄 Converting AI item: ${orderItem.item} (size: ${size})`);
    console.log(`  Modifications:`, modifications);
    
    // Find the correct menu item
    let menuItemKey = null;
    let basePrice = null;
    
    // For pizzas, always include size
    if (itemName.includes('pizza') || itemName.includes('pie')) {
      const baseItem = ITEM_MAPPINGS[itemName] || itemName;
      menuItemKey = size ? `${baseItem} ${size}` : baseItem;
      
      if (MENU_ITEMS[menuItemKey]) {
        basePrice = MENU_ITEMS[menuItemKey];
        console.log(`  ✅ Found: "${menuItemKey}" - Price: ${basePrice}`);
      }
    } else {
      // Non-pizza items
      menuItemKey = ITEM_MAPPINGS[itemName] || itemName;
      if (MENU_ITEMS[menuItemKey]) {
        basePrice = MENU_ITEMS[menuItemKey];
      }
    }
    
    if (!basePrice) {
      console.log(`  ❌ Menu item not found: ${menuItemKey}`);
      continue;
    }
    
    let finalPrice = basePrice;
    let displayMods = [];
    
    // Handle Build Your Own Pizza toppings
    if (menuItemKey.includes('build your own') && modifications.length > 0) {
      const toppings = modifications.filter(m => 
        !m.toLowerCase().includes('sauce') && 
        m.toLowerCase() !== 'secret pizza sauce' &&
        m.toLowerCase() !== 'pesto' &&
        m.toLowerCase() !== 'white'
      );
      
      // Keep sauce in modifications
      const sauce = modifications.find(m => 
        m.toLowerCase().includes('sauce') || 
        m.toLowerCase() === 'pesto' || 
        m.toLowerCase() === 'white'
      );
      
      if (sauce) displayMods.push('+ ' + sauce);
      
      if (toppings.length > 0) {
        const toppingCost = calculateToppingCost(toppings, size);
        finalPrice += toppingCost;
        toppings.forEach(t => displayMods.push('+ ' + t));
        console.log(`  Added ${toppings.length} toppings: +${toppingCost}`);
      }
    }
    
    // Handle salad modifications
    else if (menuItemKey.includes('salad')) {
      modifications.forEach(mod => {
        const modLower = mod.toLowerCase();
        if (modLower.includes('chicken')) {
          finalPrice += 5;
          displayMods.push('+ chicken');
          console.log(`  Added chicken: +$5`);
        } else if (modLower.includes('steak')) {
          finalPrice += 5;
          displayMods.push('+ steak');
          console.log(`  Added steak: +$5`);
        } else if (modLower.includes('dressing')) {
          displayMods.push('+ ' + mod);
        } else if (modLower.includes('extra')) {
          finalPrice += 2; // Extra dressing
          displayMods.push('+ ' + mod);
          console.log(`  Extra dressing: +$2`);
        }
      });
    }
    
    // Handle sub/sandwich modifications
    else if (menuItemKey.includes('philly cheese') || menuItemKey.includes('sub') || 
             menuItemKey.includes('parmigiana') || menuItemKey.includes('parm') ||
             menuItemKey.includes('sandwich') || menuItemKey.includes('combo')) {
      
      let isCombo = false;
      
      modifications.forEach(mod => {
        const modLower = mod.toLowerCase();
        
        // Check for combo
        if (modLower.includes('combo')) {
          isCombo = true;
          finalPrice += 3;
          displayMods.push('+ combo');
          console.log(`  Combo upgrade: +$3`);
        }
        // Cheese type
        else if (modLower.includes('mozzarella') || modLower.includes('american')) {
          displayMods.push('+ ' + mod);
        }
        // Protein choice
        else if (modLower.includes('chicken') || modLower.includes('steak')) {
          displayMods.push('+ ' + mod);
        }
        // Any other modification
        else {
          displayMods.push('+ ' + mod);
        }
      });
    }
    
    // Handle wings modifications
    else if (menuItemKey.includes('wings')) {
      modifications.forEach(mod => {
        displayMods.push('+ ' + mod);
        // Extra ranch/blue cheese
        if (mod.toLowerCase().includes('extra')) {
          finalPrice += 1;
          console.log(`  Extra dressing: +$1`);
        }
      });
    }
    
    // For all other items, just add modifications as-is
    else if (modifications.length > 0) {
      modifications.forEach(mod => {
        displayMods.push('+ ' + mod);
      });
    }
    
    // Add to order
    addItemToOrder(items, menuItemKey, quantity, finalPrice, displayMods);
    console.log(`  Final price: ${finalPrice}`);
  }
  
  return items;
}

// Enhanced extraction with AI
async function extractItemsFromTranscriptWithAI(transcript) {
  const fullConversation = transcript.map(t => t.message).join(' ').toLowerCase();
  
  console.log('🔍 Looking for "Your final order is" in conversation...');
  
  // Find ALL occurrences and use the LAST one
  const regex = /your final order is[:\s]+(.+?)(?:your total|how would you like|is everything correct|$)/gis;
  const matches = [...fullConversation.matchAll(regex)];
  
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const orderText = lastMatch[1].trim();
    console.log(`✅ Found ${matches.length} order confirmation(s), using the LAST one`);
    console.log('📍 Order text:', orderText);
    
    // Try AI parsing first
    const aiParsedOrder = await summarizeOrderWithAI(orderText);
    
    if (aiParsedOrder && aiParsedOrder.length > 0) {
      console.log('🤖 Using AI-parsed order');
      return convertAIParsedToItems(aiParsedOrder);
    }
  }
  
  console.log('🔄 Falling back to regex parsing');
  return null;
}

// Utility functions (keep all existing ones)
function parseQuantity(quantityStr) {
  return QUANTITY_WORDS[quantityStr.toLowerCase()] || parseInt(quantityStr) || 1;
}

function extractSizeFromText(text) {
  const sizeMatch = text.match(/\b(fourteen|eighteen|12|14|16|18)[-\s]?(inch)?\b/i);
  if (sizeMatch) {
    const size = sizeMatch[1].toLowerCase();
    if (size === 'fourteen' || size === '14') return '14';
    if (size === 'eighteen' || size === '18') return '18';
    if (size === '12') return '12';
    if (size === '16') return '16';
  }
  return null;
}

function extractToppingsFromText(text) {
  const toppings = [];
  const allToppings = [...REGULAR_TOPPINGS, ...PREMIUM_TOPPINGS];
  
  for (const topping of allToppings) {
    const regex = new RegExp(`\\b${topping.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(text)) {
      const normalizedTopping = normalizeTopping(topping.toLowerCase());
      if (!toppings.includes(normalizedTopping)) {
        toppings.push(normalizedTopping);
      }
    }
  }
  
  return toppings;
}

function normalizeTopping(topping) {
  // Normalize toppings to their standard forms
  const toppingMap = {
    'pepper': 'peppers',
    'onion': 'onions', 
    'mushroom': 'mushrooms',
    'olive': 'olives',
    'pineapples': 'pineapple',
    'meatballs': 'meatball',
    'banana pepper': 'banana peppers',
    'garlics': 'garlic', // Normalize plural to singular for garlic
    'jalapeño': 'jalapeno',
    'jalapeños': 'jalapeno',
    'jalapenos': 'jalapeno',
    'fresh basil': 'basil',
    'red-roasted peppers': 'peppers',
    'red roasted peppers': 'peppers',
    'roasted red peppers': 'peppers'
  };
  
  return toppingMap[topping] || topping;
}

function calculateToppingCost(toppings, size) {
  let cost = 0;
  const sizeKey = String(size || '14');
  
  console.log(`  Calculating topping cost for ${toppings.length} toppings on ${sizeKey}" pizza`);
  
  for (const topping of toppings) {
    const normalizedTopping = normalizeTopping(topping.toLowerCase());
    
    if (PREMIUM_TOPPINGS.some(pt => pt.toLowerCase() === normalizedTopping || normalizedTopping.includes('cheese'))) {
      cost += TOPPING_PRICES[sizeKey]?.premium || TOPPING_PRICES['14'].premium;
      console.log(`    - ${topping} (premium): $${TOPPING_PRICES[sizeKey]?.premium}`);
    } else {
      cost += TOPPING_PRICES[sizeKey]?.regular || TOPPING_PRICES['14'].regular;
      console.log(`    - ${topping} (regular): $${TOPPING_PRICES[sizeKey]?.regular}`);
    }
  }
  
  console.log(`    Total topping cost: $${cost}`);
  return cost;
}

function cleanItemText(text) {
  return text
    .replace(/\b(sides?\s+of|orders?\s+of|pieces?\s+of)\s*/gi, '')
    .replace(/\b(fourteen|eighteen|twelve|16|14|18|12)[-\s]?(inch)?\s*/gi, '')
    .replace(/\bphilly cheesesteaks\b/gi, 'philly cheese')
    .replace(/\bpizzas\b/gi, 'pizza')
    .replace(/\b(the|of|a|an)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findMenuItem(itemText, size = null) {
  const cleanText = itemText.toLowerCase().trim();
  
  // Try size-specific lookup first for pizzas AND pies
  if (size && (cleanText.includes('pizza') || cleanText.includes('pie'))) {
    const baseItem = ITEM_MAPPINGS[cleanText] || cleanText;
    const sizedItem = baseItem + ' ' + size;
    if (MENU_ITEMS[sizedItem]) {
      return sizedItem;
    }
  }
  
  // Fallback to regular mapping
  return ITEM_MAPPINGS[cleanText] || (MENU_ITEMS[cleanText] ? cleanText : null);
}

function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + (item.total || item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  
  return {
    subtotal: '$' + subtotal.toFixed(2),
    tax: '$' + tax.toFixed(2),
    total: '$' + total.toFixed(2)
  };
}

function extractContactInfo(transcript) {
  let phone = 'N/A';
  let name = 'N/A';
  let address = 'N/A';
  
  for (const turn of transcript) {
    if (turn.role === 'user') {
      // Phone number extraction
      const phoneMatch = turn.message.match(/\b(813|727)[-.\s]?(\d{3})[-.\s]?(\d{4})\b/);
      if (phoneMatch) {
        phone = phoneMatch[1] + '-' + phoneMatch[2] + '-' + phoneMatch[3];
      }
      
      // Enhanced name extraction - exclude common words
      const namePatterns = [
        /my name is\s+([a-zA-Z]+)(?:\s+and|\s+phone|\.|$)/i,
        /i'm\s+([a-zA-Z]+)(?:\s+and|\s+phone|\.|$)/i,
        /this is\s+([a-zA-Z]+)(?:\s+and|\s+phone|\.|$)/i,
        /name is\s+([a-zA-Z]+)(?:\s+and|\s+phone|\.|$)/i
      ];
      
      for (const pattern of namePatterns) {
        const match = turn.message.match(pattern);
        if (match && match[1] && match[1].toLowerCase() !== 'good' && match[1].toLowerCase() !== 'great') {
          name = match[1].trim();
          break;
        }
      }
      
      // Address extraction for delivery
      const addressMatch = turn.message.match(/(?:address is|live at|deliver to)\s+(.+?)(?:\.|,|$)/i);
      if (addressMatch) address = addressMatch[1].trim();
    }
  }
  
  return { phone, name, address };
}

function addItemToOrder(items, itemName, quantity, price, modifications = []) {
  const existingItem = items.find(item => 
    item.name === itemName && 
    JSON.stringify(item.modifications || []) === JSON.stringify(modifications)
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.total = existingItem.price * existingItem.quantity;
  } else {
    const newItem = {
      name: itemName,
      quantity: quantity,
      price: price,
      total: price * quantity
    };
    
    if (modifications && modifications.length > 0) {
      newItem.modifications = modifications;
    }
    
    items.push(newItem);
    console.log(`  ✅ Added: ${itemName} x${quantity} @ $${price}`);
  }
}

function extractItemsFromTranscript(transcript) {
  const items = [];
  const fullConversation = transcript.map(t => t.message).join(' ').toLowerCase();
  
  console.log('🔍 Full conversation:', fullConversation);
  
  // Find the LAST occurrence of order confirmation - CRITICAL for multiple confirmations
  let orderText = '';
  const patterns = [
    /your final order is[:\s]*(.+?)(?:\.\s*how would you like to pay|how would you like to pay|\?|$)/i,
    /got it[!.]?\s*your final order is[:\s]*(.+?)(?:\.\s*how would you like to pay|how would you like to pay|\?|$)/i,
    /here's your order[:\s]*(.+?)(?:\.\s*how would you like to pay|how would you like to pay|\?|$)/i,
    /thank you for confirming[.\s]*here's your order[:\s]*(.+?)(?:\.\s*how would you like to pay|how would you like to pay|\?|$)/i,
    /to confirm[,:]\s*(.+?)(?:\.\s*how would you like to pay|how would you like to pay|\?|$)/i
  ];
  
  let lastMatchIndex = -1;
  let bestMatch = null;
  
  // Search through ALL patterns and find the one with the highest index (latest in conversation)
  for (const pattern of patterns) {
    const matches = [...fullConversation.matchAll(new RegExp(pattern.source, 'gi'))];
    for (const match of matches) {
      if (match.index > lastMatchIndex && match[1]) {
        lastMatchIndex = match.index;
        bestMatch = match;
        console.log('🎯 Found order confirmation at index', match.index, 'with pattern:', pattern.source.substring(0, 50) + '...');
      }
    }
  }
  
  if (bestMatch) {
    orderText = bestMatch[1].trim();
    console.log('✅ Using LAST order confirmation:', orderText);
  }
  
  if (!orderText) {
    console.log('🔄 No order confirmation found');
    return items;
  }
  
  console.log('✅ Processing order text:', orderText);
  
  // Smart segmentation - split on semicolons first, then commas with quantity words
  let segments = [];
  
  // First split on semicolons
  const semicolonSplit = orderText.split(';');
  
  for (const semicolonSegment of semicolonSplit) {
    // Then split on commas, but only if followed by quantity words
    const parts = semicolonSegment.split(',');
    let currentSegment = '';
    
    for (let i = 0; i < parts.length; i++) {
      let part = parts[i].trim();
      
      // Remove leading "and"
      part = part.replace(/^and\s+/i, '');
      
      if (i === 0 || part.match(/^(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+/i)) {
        // Start new segment
        if (currentSegment) {
          segments.push(currentSegment.trim());
        }
        currentSegment = part;
      } else {
        // Append to current segment (it's likely a topping list)
        currentSegment += ', ' + part;
      }
    }
    
    if (currentSegment) {
      segments.push(currentSegment.trim());
    }
  }
  
  console.log('📝 Order segments:', segments);
  
  // Process each segment
  for (const segment of segments) {
    console.log('\n🔄 Processing:', segment);
    
    // Skip short or invalid segments
    if (segment.length < 3 || /^(peppers?|onions?|jalapeños?|pineapple|basil|mushrooms?)$/i.test(segment)) {
      console.log('⏭️ Skipping segment');
      continue;
    }
    
    let quantity = 1;
    let itemText = segment;
    let size = null;
    let toppings = [];
    
    // Extract quantity
    const qtyMatch = segment.match(/^(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(.+)/i);
    if (qtyMatch) {
      quantity = parseQuantity(qtyMatch[1]);
      itemText = qtyMatch[2].trim();
    } else if (segment.match(/^(a|an)\s+(.+)/i)) {
      quantity = 1;
      itemText = segment.replace(/^(a|an)\s+/i, '').trim();
    }
    
    // Extract size
    size = extractSizeFromText(segment);
    console.log('📏 Size:', size);
    
    // Extract toppings from "with" clauses
    const withMatch = itemText.match(/(.+?)\s+with\s+(.+)$/i);
    if (withMatch) {
      itemText = withMatch[1].trim();
      const toppingText = withMatch[2];
      toppings = extractToppingsFromText(toppingText);
      console.log('🥘 Toppings:', toppings);
    }
    
    // Clean item text
    const cleanedText = cleanItemText(itemText);
    console.log('🧹 Cleaned:', cleanedText);
    
    // Find menu item
    const menuItem = findMenuItem(cleanedText, size);
    console.log('🎯 Found:', menuItem);
    
    if (menuItem && MENU_ITEMS[menuItem]) {
      let basePrice = MENU_ITEMS[menuItem];
      let finalPrice = basePrice;
      let modifications = [];
      
      // Handle salad add-ons
      if (menuItem.includes('salad') && toppings.includes('chicken')) {
        finalPrice += 5;
        modifications.push('+ chicken');
      }
      
      // Handle build your own pizza toppings
      if (menuItem.includes('build your own') && toppings.length > 0) {
        const toppingCost = calculateToppingCost(toppings, size);
        finalPrice += toppingCost;
        modifications = toppings.map(t => '+ ' + t);
      } else if (toppings.length > 0) {
        modifications = toppings.map(t => '+ ' + t);
      }
      
      addItemToOrder(items, menuItem, quantity, finalPrice, modifications);
      console.log('✅ Added:', menuItem, 'qty:', quantity, 'price:', finalPrice);
    } else {
      console.log('❌ Could not match:', cleanedText);
    }
  }
  
  return items;
}

async function extractOrderFromSummary(summary, fallbackTranscript) {
  // Try AI parsing first
  if (fallbackTranscript && fallbackTranscript.length > 0) {
    console.log('🎯 Trying AI-enhanced transcript parsing');
    const aiItems = await extractItemsFromTranscriptWithAI(fallbackTranscript);
    
    if (aiItems && aiItems.length > 0) {
      console.log('✅ Successfully extracted items using AI');
      
      const contactInfo = extractContactInfo(fallbackTranscript);
      const totals = calculateTotals(aiItems);
      
      let pickupTime = 'ASAP';
      let orderType = 'pickup';
      
      if (typeof summary === 'string') {
        const summaryText = summary.toLowerCase();
        const timeMatch = summaryText.match(/(\d+)\s+(minute|min|hour|hr)/i);
        if (timeMatch) {
          pickupTime = timeMatch[1] + ' ' + timeMatch[2] + (timeMatch[1] !== '1' ? 's' : '');
        }
        
        if (/delivery|deliver/.test(summaryText)) {
          orderType = 'delivery';
        }
      }
      
      return {
        customer_name: contactInfo.name || 'N/A',
        phone: contactInfo.phone || 'N/A',
        items: aiItems,
        pickup_time: pickupTime,
        order_type: orderType,
        address: contactInfo.address || 'N/A',
        notes: '',
        payment_link: '',
        ...totals
      };
    }
  }
  
  // Fallback to original regex parsing
  console.log('🔄 Falling back to regex parsing');
  if (fallbackTranscript && fallbackTranscript.length > 0) {
    const transcriptItems = extractItemsFromTranscript(fallbackTranscript);
    
    if (transcriptItems && transcriptItems.length > 0) {
      const contactInfo = extractContactInfo(fallbackTranscript);
      const totals = calculateTotals(transcriptItems);
      
      let pickupTime = 'ASAP';
      let orderType = 'pickup';
      
      if (typeof summary === 'string') {
        const summaryText = summary.toLowerCase();
        const timeMatch = summaryText.match(/(\d+)\s+(minute|min|hour|hr)/i);
        if (timeMatch) {
          pickupTime = timeMatch[1] + ' ' + timeMatch[2] + (timeMatch[1] !== '1' ? 's' : '');
        }
        
        if (/delivery|deliver/.test(summaryText)) {
          orderType = 'delivery';
        }
      }
      
      return {
        customer_name: contactInfo.name || 'N/A',
        phone: contactInfo.phone || 'N/A',
        items: transcriptItems,
        pickup_time: pickupTime,
        order_type: orderType,
        address: contactInfo.address || 'N/A',
        notes: '',
        payment_link: '',
        ...totals
      };
    }
  }
  
  return null;
}

// Add the calculate-order endpoint for ElevenLabs integration
app.post('/calculate-order', async (req, res) => {
  try {
    let data;
    
    // Handle different ways the data might come in
    if (typeof req.body === 'string') {
      data = JSON.parse(req.body);
    } else if (req.body.body && typeof req.body.body === 'string') {
      data = JSON.parse(req.body.body);
    } else {
      data = req.body;
    }
    
    console.log('📱 Price calculation request from ElevenLabs:', JSON.stringify(data, null, 2));
    
    const { items, orderType } = data;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ 
        error: 'Invalid request: items array is required' 
      });
    }
    
    let calculatedItems = [];
    let subtotal = 0;
    
    // Process each item
    for (const item of items) {
      let itemName = item.name.toLowerCase();
      let size = item.size;
      let quantity = item.quantity || 1;
      let modifications = item.modifications || [];
      
      console.log(`\n🔄 Processing: ${item.name} (size: ${size}, qty: ${quantity})`);
      console.log(`  Modifications:`, modifications);
      
      // Find the menu item
      let menuItem = findMenuItem(itemName, size);
      
      if (menuItem && MENU_ITEMS[menuItem]) {
        let basePrice = MENU_ITEMS[menuItem];
        let finalPrice = basePrice;
        
        console.log(`  Found: ${menuItem} - Base price: ${basePrice}`);
        
        // Handle Build Your Own Pizza toppings
        if (menuItem.includes('build your own') && modifications.length > 0) {
          const toppings = modifications.filter(m => 
            !m.toLowerCase().includes('sauce') && 
            m.toLowerCase() !== 'secret pizza sauce' &&
            m.toLowerCase() !== 'pesto' &&
            m.toLowerCase() !== 'white'
          );
          
          if (toppings.length > 0) {
            const toppingCost = calculateToppingCost(toppings, size);
            finalPrice += toppingCost;
            console.log(`  Added ${toppings.length} toppings: +${toppingCost}`);
          }
        }
        
        // Handle salad add-ons
        if (menuItem.includes('salad')) {
          if (modifications.some(m => m.toLowerCase().includes('chicken'))) {
            finalPrice += 5;
            console.log(`  Added chicken: +$5`);
          }
          if (modifications.some(m => m.toLowerCase().includes('steak'))) {
            finalPrice += 5;
            console.log(`  Added steak: +$5`);
          }
          // Extra dressing
          const extraDressings = modifications.filter(m => m.toLowerCase().includes('extra dressing'));
          if (extraDressings.length > 0) {
            finalPrice += 2 * extraDressings.length;
            console.log(`  Extra dressings: +${2 * extraDressings.length}`);
          }
        }
        
        // Handle sub combos
        if (menuItem.includes('philly cheese') || menuItem.includes('sub') || 
            menuItem.includes('parmigiana') || menuItem.includes('parm')) {
          if (modifications.some(m => m.toLowerCase().includes('combo'))) {
            finalPrice += 3;
            console.log(`  Combo upgrade: +$3`);
          }
        }
        
        // Handle wings extras
        if (menuItem.includes('wings')) {
          const extraDressings = modifications.filter(m => 
            m.toLowerCase().includes('extra ranch') || 
            m.toLowerCase().includes('extra blue cheese')
          );
          if (extraDressings.length > 0) {
            finalPrice += extraDressings.length;
            console.log(`  Extra wing dressings: +${extraDressings.length}`);
          }
        }
        
        // Handle appetizer extras
        if ((menuItem.includes('meatballs') || menuItem.includes('garlic bread') || 
             menuItem.includes('seasoned french fries')) && 
            modifications.some(m => m.toLowerCase().includes('extra cheese'))) {
          finalPrice += 1;
          console.log(`  Extra cheese: +$1`);
        }
        
        if (menuItem.includes('manhattan rolls') && 
            modifications.some(m => m.toLowerCase().includes('pepperoni'))) {
          finalPrice += 1.50;
          console.log(`  Pepperoni: +$1.50`);
        }
        
        let itemTotal = finalPrice * quantity;
        subtotal += itemTotal;
        
        calculatedItems.push({
          name: menuItem,
          quantity: quantity,
          unitPrice: finalPrice,
          total: itemTotal,
          modifications: modifications
        });
      } else {
        console.log(`  ❌ Could not find menu item: ${itemName}`);
        return res.status(400).json({ 
          error: `Item not found: ${item.name}`,
          suggestion: "Please check the item name and try again"
        });
      }
    }
    
    // Add delivery fee if applicable
    let deliveryFee = 0;
    if (orderType === 'delivery') {
      deliveryFee = 4;
    }
    
    // Calculate totals
    const subtotalWithDelivery = subtotal + deliveryFee;
    const tax = subtotalWithDelivery * TAX_RATE;
    const total = subtotalWithDelivery + tax;
    
    const response = {
      items: calculatedItems,
      subtotal: subtotal.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      formattedTotal: `${total.toFixed(2)}`
    };
    
    console.log('💰 Calculated totals:', response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error calculating order:', error);
    res.status(500).json({ 
      error: 'Failed to calculate order total',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'NYNY Pizza Price Calculator v53.1',
    timestamp: new Date().toISOString()
  });
});

app.post('/post-call', async (req, res) => {
  const data = req.body;
  const transcript = data?.data?.transcript || [];

  console.log('✅ Webhook received');
  console.log('Call ID:', data?.data?.conversation_id);

  if (transcript.length > 0) {
    transcript.forEach(turn => {
      if (turn.role && turn.message) {
        console.log((turn.role === 'agent' ? 'Agent' : 'Customer') + ': "' + turn.message + '"');
      }
    });
  }

  let summaryToUse = null;
  if (data?.data?.analysis?.transcript_summary) {
    console.log('\n📝 AI-Generated Summary:');
    console.log(data.data.analysis.transcript_summary);
    summaryToUse = data.data.analysis.transcript_summary;
  }

  const detectedOrder = await extractOrderFromSummary(summaryToUse, transcript);

  if (detectedOrder) {
    console.log('\n📦 Detected ORDER:\n', JSON.stringify(detectedOrder, null, 2));

    // Send to Toast API
    try {
      if (TOAST_API_URL && TOAST_API_KEY) {
        const response = await fetch(TOAST_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + TOAST_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ order: detectedOrder })
        });

        const result = await response.json();
        console.log('✅ Toast API Response:', result);
      }
    } catch (err) {
      console.error('❌ Error sending order to Toast:', err.message);
    }

    // Save to Supabase
    try {
      if (SUPABASE_URL && SUPABASE_KEY) {
        const { error } = await supabase.from('orders').insert([{
          customer_name: detectedOrder.customer_name,
          phone_number: detectedOrder.phone,
          items: detectedOrder.items,
          pickup_time: detectedOrder.pickup_time,
          order_type: detectedOrder.order_type,
          address: detectedOrder.address,
          notes: detectedOrder.notes,
          subtotal: detectedOrder.subtotal,
          tax: detectedOrder.tax,
          total: detectedOrder.total,
          source: "NYNY Voice Agent"
        }]);

        if (error) {
          console.error('❌ Error saving order to Supabase:', error);
        } else {
          console.log('✅ Order saved to Supabase');
        }
      }
    } catch (err) {
      console.error('❌ Supabase error:', err.message);
    }
  } else {
    console.log('❌ No order detected.');
  }

  res.status(200).send('✅ Webhook received and processed');
});

app.listen(port, () => {
  console.log('============================================');
  console.log('✅ NYNY Pizza Server v53.2 - Started Successfully');
  console.log(`📍 Listening on port ${port}`);
  console.log('🔄 Features: AI order parsing, combo detection, modifications tracking');
  console.log('============================================');
});