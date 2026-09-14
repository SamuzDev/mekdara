import { z } from 'zod';

export const urlRequestSchema = z.object({
    url: z.url(),
});

export const convertResponseSchema = z.object({
    markdown: z.string(),
    raw_tokens: z.number(),
    markdown_tokens: z.number(),
});

export type UrlRequest = z.infer<typeof urlRequestSchema>;
export type ConvertResponse = z.infer<typeof convertResponseSchema>;