import { Router } from "express";
import { Validation } from "../../common/middleware/validation.js";
import * as commentValidation from "./comment.validation.js";
import { authentication } from "../../common/middleware/authentication.middleware.js";
import multer_cloud from "../../common/middleware/multer.cloud.js";
import { Store_Enum } from "../../common/enum/multer.enum.js";
import commentService from "./comment.service.js";

const commentRouter = Router({ mergeParams: true });

commentRouter.post("/",
    authentication,
    multer_cloud({ store_type: Store_Enum.memory }).array("attachments"),
    Validation(commentValidation.createCommentSchema),
    commentService.createComment);

commentRouter.post("/like/:commentId",
    authentication,
    Validation(commentValidation.commentIdSchema),
    commentService.likeComment)

commentRouter.delete("/:commentId",
    authentication,
    Validation(commentValidation.commentIdSchema),
    commentService.deleteComment)

commentRouter.put("/update/:commentId",
    authentication,
    multer_cloud({ store_type: Store_Enum.memory }).array("attachments"),
    Validation(commentValidation.updateCommentschema),
    commentService.updateComment)

export default commentRouter;
