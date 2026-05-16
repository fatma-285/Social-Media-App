import  zod  from 'zod';
import type { commentIdSchema, createCommentSchema, updateCommentschema } from "./comment.validation.js";

export type CommentDTO=zod.infer<typeof createCommentSchema.body>
export type CommentIdDTO=zod.infer<typeof commentIdSchema.params>
export type UpdateCommentDto=zod.infer<typeof updateCommentschema.body>
