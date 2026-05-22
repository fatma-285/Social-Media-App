
import {
    graphql,
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLNonNull,
    GraphQLBoolean,
    GraphQLInt,
    GraphQLList,
    GraphQLEnumType,
} from 'graphql';
import { appError } from '../../../common/utils/global-error-handler.js';
import { GenderType, userType } from './user.type.js';
import { get } from 'node:http';
import { createUserArgs, getUserArgs } from './user.args.js';
import authService from '../auth.service.js';
import { gql_authentication } from '../../../common/middleware/authentication.middleware.js';
import { authorize, gql_authorize } from '../../../common/middleware/authorization.js';
import { RoleEnum } from '../../../common/enum/user.enum.js';
import { gql_validation } from '../../../common/middleware/validation.js';
import { getUserSchema } from '../auth.validation.js';



class UserFeilds {
    constructor() { }

    query = () => {
        return {
            getUser: {
                type: userType,
                // args: getUserArgs,
                args:{token:{type:GraphQLString}} ,
                resolve:async (parent: any, args: any,context:any) => {
                    await gql_validation(getUserSchema,args)
                   const {user, decoded}=await gql_authentication(context.req.headers.authorization);
                   await gql_authorize([RoleEnum.admin],user.role)
                   return authService.getUser(user._id)
                }
            },
            listUsers: {
                type: new GraphQLList(userType),
                resolve: (parent: any, args: any,context:any) => {
                 return authService.getUsers()
                }
            }
        }
    }
    mutation = () => {
        return {
            createUser: {
                type: new GraphQLList(userType),
                args: createUserArgs,
                resolve: (parent: any, args: any) => {
                  return authService.createUser(args)
                }
            }
        }
    }
}

export default new UserFeilds