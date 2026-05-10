import  zod  from 'zod';
import type { createPostSchema, likePostSchema, updatePostSchema } from "./post.validation.js";

export type PostDTO=zod.infer<typeof createPostSchema.body>
export type likePostDTO=zod.infer<typeof likePostSchema.params>
export type updatePostDTO=zod.infer<typeof updatePostSchema.body>
export type PostIdDTO=zod.infer<typeof updatePostSchema.params>
