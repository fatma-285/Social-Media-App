import type { PopulateOptions } from "mongoose";
import type { UpdateQuery } from "mongoose";
import type { ProjectionType, QueryFilter, QueryOptions } from "mongoose";
import type { HydratedDocument, Model, Types } from "mongoose";
import { appError } from "../../common/utils/global-error-handler.js";

//abstract class cant be instantiated , we can only extend it
abstract class BaseRepository<TDocument> {
    constructor(protected readonly model: Model<TDocument>) { }

    async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
        return this.model.create(data);
    }

    async findById(id: Types.ObjectId): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findById(id);
    }

    async findOne({
        filter,
        projection,
        options
    }: {
        filter: QueryFilter<TDocument>,
        projection?: ProjectionType<TDocument>,
        options?: QueryOptions<TDocument>
    }): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findOne(filter, projection)
            .populate(options?.populate as PopulateOptions)
            .sort(options?.sort)
            .skip(options?.skip!)
            .limit(options?.limit!);
    }

    async find({
        filter,
        projection,
        options
    }: {
        filter: QueryFilter<TDocument>,
        projection?: ProjectionType<TDocument>,
        options?: QueryOptions<TDocument>
    }): Promise<HydratedDocument<TDocument>[] | []> {
        return this.model.find(filter, projection)
            .sort(options?.sort)
            .skip(options?.skip!)
            .limit(options?.limit!)
            .populate(options?.populate as PopulateOptions);
    }

    async findByIdAndUpdate({
        id,
        update,
        options
    }: {
        id: Types.ObjectId,
        update: UpdateQuery<TDocument>,
        options?: QueryOptions<TDocument>
    }): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findByIdAndUpdate(id, update, { new: true, ...options });
    }

    async findOneAndUpdate({
        filter,
        update,
        options
    }: {
        filter: QueryFilter<TDocument>,
        update: UpdateQuery<TDocument>,
        options?: QueryOptions<TDocument>
    }): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findOneAndUpdate(filter, update, { new: true, ...options });
    }

    async findOneAndDelete({
        filter,
        options
    }: {
        filter: QueryFilter<TDocument>,
        options?: QueryOptions<TDocument>
    }
    ): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findOneAndDelete(filter, options);
    }

    async paginate<T>({
        page,
        limit,
        sort,
        populate,
        search,
    }: {
        page?: number,
        limit?: number,
        sort?: any,
        populate?: any,
        search?: QueryFilter<T>
    }) {
        page = +page! || 1
        limit = +limit! || 1

        if (page < 1) page = 1
        if (limit < 1) limit = 1

        const skip = (page - 1) * limit

        const [data, count] = await Promise.all([
            await this.model.find({ ...(search ?? {}) }).limit(limit).sort(sort).skip(skip).populate(populate).exec(),
            await this.model.countDocuments({ ...(search ?? {}) })
        ])

        const totalPages = Math.ceil(count / limit)

        return {
            meta: {
                currentPage: page,
                limit,
                count,
                totalPages
            },
            data
        }
    }
}

export default BaseRepository