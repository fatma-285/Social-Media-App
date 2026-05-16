import zod  from 'zod';
import { general_rules } from '../../common/utils/generalRules.js';
import { allow_comment_enum, availibility_enum, On_Model_enum } from '../../common/enum/post.enum.js';

export const createCommentSchema={
    body: zod.strictObject({
        content: zod.string().optional(),
        attachments: zod.array(general_rules.file).optional(),
        tags: zod.array(general_rules.id).optional(),
        onModel:zod.enum(On_Model_enum)
           }).superRefine((args,ctx)=>{
        if(!args.attachments?.length && !args.content){
            ctx.addIssue({
                code:"custom",
                path:["content"],
                message:"content is required"
            })
        }
        if(args?.tags){
            const uniqueTags=new Set(args.tags)
            if(uniqueTags.size!==args.tags.length){
                ctx.addIssue({
                    code:"custom",
                    path:["tags"],
                    message:"tags must be unique"
                })
            }
        }
    }),
    params:zod.strictObject({
        postId:general_rules.id,
        commentId:general_rules.id.optional()
    })
}

export const commentIdSchema={
    params:zod.strictObject({
        postId:general_rules.id,
        commentId:general_rules.id
    })
}

export const updateCommentschema={
    body: zod.strictObject({
        content: zod.string().optional(),
        attachments: zod.array(general_rules.file).optional(),
        removeAttachment: zod.array(zod.string()).optional(),
        tags: zod.array(general_rules.id).optional(),
        removeTags: zod.array(general_rules.id).optional(),
    }).superRefine((args,ctx)=>{
        if(args?.tags){
            const uniqueTags=new Set(args.tags)
            if(uniqueTags.size!==args.tags.length){
                ctx.addIssue({
                    code:"custom",
                    path:["tags"],
                    message:"tags must be unique"
                })
            }
        }
    }),
    params:commentIdSchema.params
}

export const createReplySchema={
    body: zod.strictObject({
        content: zod.string().optional(),
        attachments: zod.array(general_rules.file).optional(),
        tags: zod.array(general_rules.id).optional(),
    }).superRefine((args,ctx)=>{
        if(args?.tags){
            const uniqueTags=new Set(args.tags)
            if(uniqueTags.size!==args.tags.length){
                ctx.addIssue({
                    code:"custom",
                    path:["tags"],
                    message:"tags must be unique"
                })
            }
        }
    }),
    params:commentIdSchema.params
}