import { Router } from "express";
import  ChatService from "./chat.service.js";
import { Validation } from "../../common/middleware/validation.js";
import { authentication } from "../../common/middleware/authentication.middleware.js";
import multer_cloud from "../../common/middleware/multer.cloud.js";
import { multer_enum, Store_Enum } from "../../common/enum/multer.enum.js";

const chatRouter = Router({mergeParams:true});

chatRouter.get("/:userId/chat",authentication,ChatService.getChat)
chatRouter.get("/group/:groupId",authentication,ChatService.getGroupChat)

chatRouter.post("/group",
    authentication,
    multer_cloud({store_type:Store_Enum.memory,custom_types:multer_enum.image}).single("attachment"),
    ChatService.createGroupChat)

export default chatRouter;
