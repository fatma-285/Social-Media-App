import { GraphQLEnumType, GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLID } from "graphql"

export let GenderType = new GraphQLEnumType({
    name: "genderType",
    values: {
        male: { value: "male" },
        female: { value: "female" }
    }
})
export let userType = new GraphQLObjectType({
    name: "user",
    fields: {
        _id: { type: GraphQLID },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        phone: { type: GraphQLString },
        email: { type: GraphQLString },
        pprofilePic: { type: GraphQLString },
        age: { type: GraphQLInt },
        gender: { type: GenderType }
    }
})