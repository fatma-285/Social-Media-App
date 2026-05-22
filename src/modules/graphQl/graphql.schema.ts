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
import { appError } from '../../common/utils/global-error-handler.js';
import userFeilds from '../auth/graphql/user.feilds.js';

   
   export const graphql_schema = new GraphQLSchema({
         query: new GraphQLObjectType({
            name: "users",
            description: "get users",

            fields: {
               ...userFeilds.query(),
            }
        }),
        mutation: new GraphQLObjectType({
            name: "mutation",
            fields: {
               ...userFeilds.mutation(),
            }
         })})