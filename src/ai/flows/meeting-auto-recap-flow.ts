'use server';
/**
 * @fileOverview A Genkit flow for generating a concise summary of a completed meeting.
 *
 * - meetingAutoRecap - A function that generates a meeting recap.
 * - MeetingAutoRecapInput - The input type for the meetingAutoRecap function.
 * - MeetingAutoRecapOutput - The return type for the meetingAutoRecap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MeetingAutoRecapInputSchema = z.object({
  meetingContent: z
    .string()
    .describe(
      'The raw transcript or notes from a completed meeting, including discussions and logs.'
    ),
});
export type MeetingAutoRecapInput = z.infer<typeof MeetingAutoRecapInputSchema>;

const MeetingAutoRecapOutputSchema = z.object({
  summary: z.string().describe('A concise overall summary of the meeting.'),
  discussionPoints: z
    .array(z.string())
    .describe('Key discussion points highlighted during the meeting.'),
  actionItems: z
    .array(
      z.object({
        description: z.string().describe('Description of the action item.'),
        assignee: z
          .string()
          .optional()
          .describe('Optional: Who is responsible for this action item.'),
        dueDate: z
          .string()
          .optional()
          .describe('Optional: The due date for this action item (YYYY-MM-DD format).'),
      })
    )
    .describe('List of action items decided during the meeting.'),
});
export type MeetingAutoRecapOutput = z.infer<typeof MeetingAutoRecapOutputSchema>;

export async function meetingAutoRecap(
  input: MeetingAutoRecapInput
): Promise<MeetingAutoRecapOutput> {
  return meetingAutoRecapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'meetingAutoRecapPrompt',
  input: {schema: MeetingAutoRecapInputSchema},
  output: {schema: MeetingAutoRecapOutputSchema},
  prompt: `You are an AI assistant specialized in summarizing meeting content.
Your task is to take the provided meeting discussion and logs and generate a concise summary, extract key discussion points, and identify all action items with their assignees and due dates if available.

Meeting Content:
{{{meetingContent}}}

Instructions:
1.  Provide a single paragraph, concise overall summary of the meeting.
2.  List key discussion points as a bulleted list.
3.  List action items as a bulleted list. For each action item, include a description, and if present in the content, the assignee and a due date (in YYYY-MM-DD format). If an assignee or due date is not specified, omit it for that specific action item.
`,
});

const meetingAutoRecapFlow = ai.defineFlow(
  {
    name: 'meetingAutoRecapFlow',
    inputSchema: MeetingAutoRecapInputSchema,
    outputSchema: MeetingAutoRecapOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
