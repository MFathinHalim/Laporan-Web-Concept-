import { Model, Schema, model, models } from "mongoose";

const userSchema: Schema<userType> = new Schema<userType>({
    id: String,
    username: String,
    password: String,
    atmin: Boolean,
});

const userModel: Model<userType> = models.user || model("user", userSchema);
export { userModel, userSchema };