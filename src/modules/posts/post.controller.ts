import { Router } from "express";
import { Validation } from "../../common/middleware/validation.js";
import * as postValidation from "./post.validation.js";
import { authentication } from "../../common/middleware/authentication.middleware.js";
import multer_cloud from "../../common/middleware/multer.cloud.js";
import { Store_Enum } from "../../common/enum/multer.enum.js";
import postService from "./post.service.js";

const postRouter = Router();
postRouter.post("/create",
    authentication,
    multer_cloud({store_type:Store_Enum.memory}).array("attachments"),
    Validation(postValidation.createPostSchema),
    postService.createPost);

postRouter.put("/update/:postId",
    authentication,
    multer_cloud({store_type:Store_Enum.memory}).array("attachments"),
    Validation(postValidation.updatePostSchema),
    postService.updatePost);

postRouter.get("/",authentication,postService.getPosts);
postRouter.post("/like/:postId",
    authentication,
    Validation(postValidation.likePostSchema),
    postService.likePost);
export default postRouter;
