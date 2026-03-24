export type BusinessNiche = 'hotel' | 'restaurant' | 'coach' | 'real_estate';

export interface ContentDay {
  day: number;
  theme: string;
  platform: string;
  format: 'reel' | 'carousel' | 'post' | 'story' | 'thread';
  hook: string;
  cta: string;
  goal: 'awareness' | 'engagement' | 'conversion';
}

export interface BusinessTemplate {
  id: BusinessNiche;
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  calendar: ContentDay[];
}

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: 'hotel',
    name: 'Hotel Booking Boost',
    description: 'Drive direct bookings with property highlights, guest stories, and seasonal offers',
    icon: '🏨',
    accentColor: 'from-amber-500/20 to-orange-500/10 border-amber-500/20',
    calendar: [
      { day: 1, theme: 'Property highlight reel', platform: 'Instagram', format: 'reel', hook: "You won't believe what's hidden in our amenities...", cta: 'Book now — link in bio', goal: 'awareness' },
      { day: 3, theme: 'Guest testimonial', platform: 'Instagram', format: 'carousel', hook: '"We almost stayed somewhere else. Here\'s what changed our minds..."', cta: 'Read full review → book your stay', goal: 'conversion' },
      { day: 5, theme: 'Local experience guide', platform: 'Instagram', format: 'carousel', hook: '5 things to do nearby that no travel blog will tell you', cta: 'Save this for your trip', goal: 'engagement' },
      { day: 7, theme: 'Limited weekend offer', platform: 'Instagram', format: 'post', hook: 'Last 3 rooms this weekend at 20% off', cta: 'DM us "WEEKEND" to claim', goal: 'conversion' },
      { day: 10, theme: 'Behind the scenes', platform: 'Instagram', format: 'reel', hook: 'A day in the life of our team — what really goes into your perfect stay', cta: 'Follow for more insider access', goal: 'awareness' },
      { day: 12, theme: 'Room tour', platform: 'Instagram', format: 'reel', hook: 'Walking into our suite for the first time 😍', cta: 'Tap the link to book this room', goal: 'conversion' },
      { day: 14, theme: 'User generated content', platform: 'Instagram', format: 'post', hook: 'When our guests say it better than we ever could...', cta: 'Tag us in your photos for a feature', goal: 'engagement' },
      { day: 16, theme: 'Seasonal package', platform: 'Instagram', format: 'carousel', hook: 'The perfect getaway — everything included', cta: 'Swipe to see what\'s included → Book link in bio', goal: 'conversion' },
      { day: 18, theme: 'Amenity spotlight', platform: 'Instagram', format: 'reel', hook: 'Our pool is the reason guests come back every year', cta: 'Experience it yourself — book now', goal: 'awareness' },
      { day: 21, theme: 'Travel tip', platform: 'Instagram', format: 'carousel', hook: '7 things to pack that most travelers forget', cta: 'Save this + follow for more travel tips', goal: 'engagement' },
      { day: 23, theme: 'Flash deal', platform: 'Instagram', format: 'post', hook: '⚡ 48-hour flash sale — 25% off all rooms', cta: 'Book before it\'s gone → link in bio', goal: 'conversion' },
      { day: 25, theme: 'Staff story', platform: 'Instagram', format: 'reel', hook: 'Meet the person behind your perfect breakfast every morning', cta: 'Follow to meet the rest of our team', goal: 'awareness' },
      { day: 28, theme: 'Month recap', platform: 'Instagram', format: 'carousel', hook: 'This month: hundreds of happy guests, unforgettable moments', cta: 'Be part of next month\'s story — book now', goal: 'conversion' },
    ],
  },
  {
    id: 'restaurant',
    name: 'Restaurant Foot Traffic',
    description: 'Fill tables with mouthwatering content, specials, and community engagement',
    icon: '🍽️',
    accentColor: 'from-red-500/20 to-rose-500/10 border-red-500/20',
    calendar: [
      { day: 1, theme: 'Hero dish reel', platform: 'Instagram', format: 'reel', hook: 'The dish that made 3 food bloggers cancel their diet', cta: 'Reserve your table — link in bio', goal: 'awareness' },
      { day: 3, theme: "Chef's story", platform: 'Instagram', format: 'reel', hook: 'Our head chef has been perfecting this recipe for 12 years. Here\'s why.', cta: "Come taste it — we're open for lunch and dinner", goal: 'awareness' },
      { day: 5, theme: 'Weekly special', platform: 'Instagram', format: 'post', hook: "This week's special is so good, we almost didn't put it on the menu", cta: 'Available Thu–Sun only. Reserve now', goal: 'conversion' },
      { day: 7, theme: 'Behind the kitchen', platform: 'Instagram', format: 'reel', hook: 'What happens in our kitchen at 6am before we open', cta: 'Follow for more kitchen secrets', goal: 'engagement' },
      { day: 10, theme: 'Customer feature', platform: 'Instagram', format: 'post', hook: 'When a guest said this about our signature dish, we framed it on the wall', cta: 'Tag us in your visit for a chance to be featured', goal: 'engagement' },
      { day: 12, theme: 'Ingredient sourcing', platform: 'Instagram', format: 'carousel', hook: 'We drove 2 hours to find the best ingredients in the state. Worth it?', cta: 'Taste the difference — book a table', goal: 'awareness' },
      { day: 14, theme: 'Weekend vibes', platform: 'Instagram', format: 'reel', hook: 'Friday nights hit different 🎶', cta: 'Join us this weekend — call or book online', goal: 'conversion' },
      { day: 17, theme: 'Cocktail feature', platform: 'Instagram', format: 'reel', hook: 'Our bartender spent 3 months perfecting this cocktail', cta: 'Order it this week — limited batch', goal: 'conversion' },
      { day: 20, theme: 'Community post', platform: 'Instagram', format: 'post', hook: 'Proud to be part of this community for years', cta: 'Share your favorite memory with us below', goal: 'engagement' },
      { day: 22, theme: 'Recipe tease', platform: 'Instagram', format: 'reel', hook: "We're almost revealing our secret recipe. Almost.", cta: 'Follow + comment "RECIPE" to be first to know', goal: 'engagement' },
      { day: 25, theme: 'Private event offer', platform: 'Instagram', format: 'carousel', hook: 'Planning a birthday, anniversary, or team dinner? We have the perfect setup', cta: 'DM us to check availability', goal: 'conversion' },
      { day: 28, theme: 'Month favorites', platform: 'Instagram', format: 'carousel', hook: 'Your most-ordered dishes this month — we see you 👀', cta: 'Come back for more — reserve your table', goal: 'engagement' },
    ],
  },
  {
    id: 'coach',
    name: 'Coach Lead Generator',
    description: 'Build authority and generate leads with value-driven content and transformation stories',
    icon: '🎯',
    accentColor: 'from-purple-500/20 to-violet-500/10 border-purple-500/20',
    calendar: [
      { day: 1, theme: 'Big value post', platform: 'LinkedIn', format: 'thread', hook: "I helped dozens of clients achieve results. Here's the exact framework:", cta: 'Save this. Share with someone who needs it.', goal: 'awareness' },
      { day: 3, theme: 'Client transformation', platform: 'Instagram', format: 'carousel', hook: 'A client came to me stuck. 90 days later: complete transformation', cta: 'DM me "TRANSFORM" to learn how', goal: 'conversion' },
      { day: 5, theme: 'Common mistake', platform: 'Instagram', format: 'reel', hook: 'The #1 mistake that keeps people stuck (and how to fix it)', cta: 'Follow for the fix', goal: 'awareness' },
      { day: 7, theme: 'Free resource promo', platform: 'Instagram', format: 'post', hook: "I created a free guide that changes everything. Dropping it today.", cta: 'Comment "FREE" and I\'ll DM it to you', goal: 'conversion' },
      { day: 10, theme: 'Mindset shift', platform: 'Instagram', format: 'carousel', hook: '5 beliefs that are quietly holding you back', cta: 'Save this and revisit it weekly', goal: 'engagement' },
      { day: 12, theme: 'Day in my life', platform: 'Instagram', format: 'reel', hook: 'A day in the life of someone who works 4 hours a day', cta: 'Follow to see how I got here', goal: 'awareness' },
      { day: 14, theme: 'Objection handling', platform: 'LinkedIn', format: 'thread', hook: '"I can\'t afford coaching." Here\'s what I tell every person who says that:', cta: 'Book a free 15-min call — link in bio', goal: 'conversion' },
      { day: 17, theme: 'Quick win tip', platform: 'Instagram', format: 'reel', hook: 'Try this one thing for 7 days and tell me what happens', cta: 'Follow for weekly tips like this', goal: 'engagement' },
      { day: 20, theme: 'Behind the coaching', platform: 'Instagram', format: 'reel', hook: 'What a real coaching session looks like (with permission)', cta: 'Curious about working together? DM me', goal: 'conversion' },
      { day: 22, theme: 'Poll / engagement', platform: 'Instagram', format: 'story', hook: "What's your biggest challenge right now?", cta: "Vote + I'll make content about the winner", goal: 'engagement' },
      { day: 25, theme: 'Authority post', platform: 'LinkedIn', format: 'post', hook: "After years in this field, here's what nobody talks about:", cta: "Follow for the insights they don't teach", goal: 'awareness' },
      { day: 28, theme: 'Spots opening', platform: 'Instagram', format: 'post', hook: "I'm opening new client spots next month. Here's who they're for:", cta: 'DM me "READY" if that\'s you', goal: 'conversion' },
    ],
  },
  {
    id: 'real_estate',
    name: 'Real Estate Agent Leads',
    description: 'Generate buyer and seller leads with market insights, listings, and local expertise',
    icon: '🏠',
    accentColor: 'from-green-500/20 to-emerald-500/10 border-green-500/20',
    calendar: [
      { day: 1, theme: 'Market update', platform: 'Instagram', format: 'carousel', hook: 'Local real estate market this month — here\'s what buyers and sellers need to know', cta: 'Save this + follow for weekly updates', goal: 'awareness' },
      { day: 3, theme: 'New listing', platform: 'Instagram', format: 'reel', hook: 'Just listed: stunning property now available', cta: 'DM me to schedule a showing', goal: 'conversion' },
      { day: 5, theme: 'Neighborhood guide', platform: 'Instagram', format: 'carousel', hook: 'Why this neighborhood is the most underrated place to buy right now', cta: 'Follow for more local insights', goal: 'awareness' },
      { day: 8, theme: 'Buyer tip', platform: 'Instagram', format: 'reel', hook: '3 things first-time buyers always regret not doing', cta: 'Save this before you start house hunting', goal: 'engagement' },
      { day: 10, theme: 'Sold story', platform: 'Instagram', format: 'post', hook: 'Sold in 7 days at asking price. Here\'s how we did it.', cta: 'Thinking of selling? DM me for a free home valuation', goal: 'conversion' },
      { day: 13, theme: 'Home prep tips', platform: 'Instagram', format: 'carousel', hook: 'These 5 cheap upgrades added $20K to a home\'s sale price', cta: 'DM "VALUE" for your free home prep checklist', goal: 'conversion' },
      { day: 16, theme: 'Client testimonial', platform: 'Instagram', format: 'post', hook: '"Found us our dream home in 3 weeks when we thought it was impossible"', cta: "Ready to find yours? Let's connect", goal: 'conversion' },
      { day: 19, theme: 'Investment insight', platform: 'LinkedIn', format: 'post', hook: 'Rental yields are looking strong — here\'s where investors are looking', cta: 'DM me for my investment property shortlist', goal: 'conversion' },
      { day: 22, theme: 'Open house promo', platform: 'Instagram', format: 'reel', hook: "Open house this Sunday — and this property won't last", cta: 'RSVP in comments', goal: 'conversion' },
      { day: 25, theme: 'Market myth bust', platform: 'Instagram', format: 'carousel', hook: "5 things you've heard about the market that aren't true", cta: 'Save + share with anyone house hunting', goal: 'engagement' },
      { day: 28, theme: 'Monthly activity', platform: 'Instagram', format: 'post', hook: 'Homes sold, buyers helped, lives changed this month', cta: 'Ready to be next? Let\'s talk', goal: 'awareness' },
    ],
  },
];

export function getTemplate(niche: BusinessNiche): BusinessTemplate | undefined {
  return BUSINESS_TEMPLATES.find(t => t.id === niche);
}
