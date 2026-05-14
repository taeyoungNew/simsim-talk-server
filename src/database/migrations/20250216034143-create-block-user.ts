"use strict";
import { DataTypes, QueryInterface } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
    await queryInterface.createTable("BlockUsers", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      blockerId: {
        allowNull: false,
        type: Sequelize.UUID,
        onUpdate: "cascade",
        onDelete: "cascade",
        references: {
          key: "id",
          model: "Users",
        },
      },
      blockedId: {
        allowNull: false,
        type: Sequelize.UUID,
        onUpdate: "cascade",
        onDelete: "cascade",
        references: {
          key: "id",
          model: "Users",
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    // 1. 복합 UNIQUE 추가
    await queryInterface.addConstraint("BlockUsers", {
      fields: ["blockerId", "blockedId"],
      type: "unique",
      name: "unique_block_relation",
    });

    // 2. 인덱스 추가
    await queryInterface.addIndex("BlockUsers", ["blockerId"]);
    await queryInterface.addIndex("BlockUsers", ["blockedId"]);
  },

  async down(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
    await queryInterface.removeConstraint(
      "BlockUsers",
      "unique_block_relation",
    );

    await queryInterface.removeIndex("BlockUsers", ["blockerId"]);
    await queryInterface.removeIndex("BlockUsers", ["blockedId"]);

    await queryInterface.dropTable("BlockUsers");
  },
};
