"use strict";
import { MYSQL_URL } from "../../config";
import config from "../sequelize.config";
import sequelizeConnection from "../connection";
import Users from "./users";
import UserInfos from "./user-infos";
import Posts from "./posts";
import Comments from "./comments";
import PostLikes from "./post-likes";
import CommentLikes from "./comment-like";
import Follows from "./follows";
import BlockUsers from "./block-user";
import ChatRooms from "./chat-rooms";
import Messages from "./messages";
import MessageAlarms from "./message-alarms";
import Alarms from "./alarms";

const Sequelize = require("sequelize");
const db: any = {};

const sequelize = sequelizeConnection;

db.Users = Users.initModel(sequelizeConnection);
db.UserInfos = UserInfos.initModel(sequelizeConnection);
db.Posts = Posts.initModel(sequelizeConnection);
db.Comments = Comments.initModel(sequelizeConnection);
db.PostLikes = PostLikes.initModel(sequelizeConnection);
db.CommentLikes = CommentLikes.initModel(sequelizeConnection);
db.Follows = Follows.initModel(sequelizeConnection);
db.ChatRooms = ChatRooms.initModel(sequelizeConnection);
db.Messages = Messages.initModel(sequelizeConnection);
db.MessageAlarms = MessageAlarms.initModel(sequelizeConnection);
db.BlockUsers = BlockUsers.initModel(sequelizeConnection);
db.Alarms = Alarms.initModel(sequelizeConnection);

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
export default db;
export { sequelize };
