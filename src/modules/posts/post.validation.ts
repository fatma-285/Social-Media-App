import zod  from 'zod';
import { general_rules } from '../../common/utils/generalRules.js';
import { allow_comment_enum, availibility_enum } from '../../common/enum/post.enum.js';

export const createPostSchema={
    body: zod.strictObject({
        content: zod.string().optional(),
        attachments: zod.array(general_rules.file).optional(),
        tags: zod.array(general_rules.id).optional(),
        availablity:zod.enum(availibility_enum).default(availibility_enum.public),
        allowComment:zod.enum(allow_comment_enum).default(allow_comment_enum.allow)
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
    })
}

export const likePostSchema={
    params:zod.strictObject({
        postId:general_rules.id
    })
}

export const updatePostSchema={
    body: zod.strictObject({
        content: zod.string().optional(),
        attachments: zod.array(general_rules.file).optional(),
        removeAttachment: zod.array(zod.string()).optional(),
        tags: zod.array(general_rules.id).optional(),
        removeTags: zod.array(general_rules.id).optional(),
        availablity:zod.enum(availibility_enum).default(availibility_enum.public),
        allowComment:zod.enum(allow_comment_enum).default(allow_comment_enum.allow)
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
    params:likePostSchema.params
}
