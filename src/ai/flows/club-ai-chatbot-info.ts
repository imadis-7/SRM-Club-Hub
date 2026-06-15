'use server';
/**
 * @fileOverview A Genkit flow for the SRM AI Concierge feature.
 * Now unrestricted to answer general knowledge questions while remaining
 * aware of the hub's specific context.
 *
 * - clubAIChatbotInfo - A function that processes member questions.
 * - ClubAIChatbotInfoInput - The input type for the clubAIChatbotInfo function.
 * - ClubAIChatbotInfoOutput - The return type for the clubAIChatbotInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const ClubAIChatbotInfoInputSchema = z.object({
  question: z.string().describe('The member\'s question or command.'),
  clubContext: z.string().optional().describe('Contextual information about the current club state, members, and scheduled meetings.'),
});
export type ClubAIChatbotInfoInput = z.infer<typeof ClubAIChatbotInfoInputSchema>;

// Output Schema
const ClubAIChatbotInfoOutputSchema = z.object({
  answer: z.string().describe('The AI concierge\'s answer to the member\'s question.'),
});
export type ClubAIChatbotInfoOutput = z.infer<typeof ClubAIChatbotInfoOutputSchema>;

// Wrapper function to call the flow
export async function clubAIChatbotInfo(input: ClubAIChatbotInfoInput): Promise<ClubAIChatbotInfoOutput> {
  return clubAIChatbotInfoFlow(input);
}

// Define the prompt
const clubAIChatbotInfoPrompt = ai.definePrompt({
  name: 'clubAIChatbotInfoPrompt',
  input: {schema: ClubAIChatbotInfoInputSchema},
  output: {schema: ClubAIChatbotInfoOutputSchema},
  prompt: `You are SRM AI, the intelligent AI Concierge for the SRM Club Hub, powered by Gemini.

You are a highly capable assistant. You have two primary roles:
1. HUB EXPERT: Use the provided CORE KNOWLEDGE to answer specific questions about this club hub, its members, and scheduled meetings.
2. GENERAL ASSISTANT: You are free to answer any question on any topic (coding, science, history, creative writing, etc.) using your broad internal knowledge.

CORE KNOWLEDGE (HUB CONTEXT):
{{{clubContext}}}

GUIDELINES:
1. Be helpful, friendly, and professional.
2. If the user asks about the hub, meetings, or members, always refer to the CORE KNOWLEDGE first.
3. If the user asks general questions or asks for help with tasks (like writing code or summaries), use your full intelligence to provide excellent answers.
4. You are NOT restricted to hub-only topics. You are free to answer everything.

USER QUESTION:
{{{question}}}

Provide a clear and helpful response.`,
});

// Define the flow
const clubAIChatbotInfoFlow = ai.defineFlow(
  {
    name: 'clubAIChatbotInfoFlow',
    inputSchema: ClubAIChatbotInfoInputSchema,
    outputSchema: ClubAIChatbotInfoOutputSchema,
  },
  async (input) => {
    const {output} = await clubAIChatbotInfoPrompt(input);
    if (!output) {
      throw new Error('No output received from Gemini.');
    }
    return output;
  }
);
