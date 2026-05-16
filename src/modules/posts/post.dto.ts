import  zod  from 'zod';
import type { createPostSchema, PostIdSchema, updatePostSchema } from "./post.validation.js";

export type PostDTO=zod.infer<typeof createPostSchema.body>
export type likePostDTO=zod.infer<typeof PostIdSchema.params>
export type updatePostDTO=zod.infer<typeof updatePostSchema.body>
export type PostIdDTO=zod.infer<typeof updatePostSchema.params>
