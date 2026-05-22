import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { GenderType } from "./user.type.js";

export const getUserArgs = {
    _id: {
        type: new GraphQLNonNull(GraphQLInt)
    }
}

export const createUserArgs = {
    _id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    age: { type: new GraphQLNonNull(GraphQLInt) },
    gender: { type: new GraphQLNonNull(GenderType) }
}