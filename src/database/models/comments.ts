"use strict";
import { Model, DataTypes, Association, Sequelize } from "sequelize";
import connection from "../connection";
import Users from "./users";
import Posts from "./posts";
import CommentLikes from "./comment-like";

interface CommentsAttributes {
  userId: string;
  postId: number;
  content: string;
}

class Comments extends Model implements CommentsAttributes {
  public userId!: string;
  public postId!: number;
  public content!: string;

  static initModel(sequelize: Sequelize) {
    Comments.init(
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.NUMBER,
        },
        userId: {
          allowNull: false,
          type: DataTypes.UUID,
        },
        postId: {
          allowNull: false,
          type: DataTypes.INTEGER,
        },
        userNickname: {
          allowNull: false,
          type: DataTypes.STRING,
        },
        content: DataTypes.STRING,
      },
      {
        sequelize: sequelize,
        modelName: "Comments",
      },
    );
    return Comments;
  }

  static associate(db: any) {
    Comments.belongsTo(db.Posts, {
      foreignKey: "postId",
      targetKey: "id",
      onUpdate: "cascade",
      onDelete: "cascade",
    });
    Comments.belongsTo(db.Users, {
      foreignKey: "userId",
      targetKey: "id",
      onUpdate: "cascade",
      onDelete: "cascade",
    });

    Comments.belongsToMany(db.CommentLikes, {
      through: "CommentLikes",
      as: "commentId",
      onUpdate: "cascade",
      onDelete: "cascade",
    });
  }
}

// Comments.init(
//   {
//     id: {
//       allowNull: false,
//       autoIncrement: true,
//       primaryKey: true,
//       type: DataTypes.NUMBER,
//     },
//     userId: {
//       allowNull: false,
//       type: DataTypes.UUID,
//     },
//     postId: {
//       allowNull: false,
//       type: DataTypes.INTEGER,
//     },
//     userNickname: {
//       allowNull: false,
//       type: DataTypes.STRING,
//     },
//     content: DataTypes.STRING,
//   },
//   {
//     sequelize: connection,
//     modelName: "Comments",
//   }
// );

export default Comments;

// const {
//   Model
// } = require('sequelize');
// module.exports = (sequelize, DataTypes) => {
//   class Comments extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models) {
//       // define association here
//     }
//   }
//   Comments.init({
//     userId: DataTypes.INTEGER,
//     postId: DataTypes.INTEGER,
//     content: DataTypes.STRING
//   }, {
//     sequelize,
//     modelName: 'Comments',
//   });
//   return Comments;
// };
