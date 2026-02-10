import { v7 } from "uuid";
import {
    integer,
    pgTable,
    varchar,
    uuid,
    foreignKey,
    timestamp,
    text,
    pgEnum,
    boolean,
} from "drizzle-orm/pg-core";

export const transactionTypeEnum = pgEnum("transaction_type", ["topup", "payment"]);
export const topupStatusEnum = pgEnum("topup_status", ["pending", "completed", "failed"]);
export const roleEnum = pgEnum("user_roles", ["member", "admin"]);
export const fileTypeEnum = pgEnum("file_type", ["thumbnail", "attachment", "content"]);
export type FileType = (typeof fileTypeEnum.enumValues)[number];

export const usersTable = pgTable("users", {
    id: uuid()
        .$defaultFn(() => v7())
        .primaryKey(),
    email: varchar({ length: 255 }).notNull().unique(),
    display_name: varchar({ length: 255 }).notNull(),
    profile_image_url: text(),
    balance: integer().notNull().default(0),
    role: roleEnum("role").notNull().default("member"),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp({ withTimezone: true }),
});

export const studentInformationTable = pgTable(
    "user_information",
    {
        id: uuid()
            .$defaultFn(() => v7())
            .primaryKey(),
        user_id: uuid().notNull(),
        prefix: varchar({ length: 255 }).notNull(),
        full_name: varchar({ length: 255 }).notNull(),
        education_level: integer().notNull(),
        school: varchar({ length: 255 }).notNull(),
        food_allergies: varchar({ length: 255 }),
        parent_name: varchar({ length: 255 }).notNull(),
        parent_email: varchar({ length: 255 }).notNull(),
        secondary_email: varchar({ length: 255 }),
        phone_number: varchar({ length: 20 }),
        created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        foreignKey({
            columns: [table.user_id],
            foreignColumns: [usersTable.id],
        }),
    ]
);

export const oAuthAccountTable = pgTable(
    "oauth_account",
    {
        id: uuid()
            .$defaultFn(() => v7())
            .primaryKey(),
        user_id: uuid().notNull(),
        provider: varchar({ length: 255 }).notNull(),
        provider_account_id: varchar({ length: 255 }).notNull(),
        created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
        deleted_at: timestamp({ withTimezone: true }),
    },
    (table) => [
        foreignKey({
            columns: [table.user_id],
            foreignColumns: [usersTable.id],
        }),
    ]
);

export const sessionsTable = pgTable(
    "sessions",
    {
        id: uuid()
            .$defaultFn(() => v7())
            .primaryKey(),
        user_id: uuid().notNull(),
        created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
        expired_at: timestamp({ withTimezone: true }).notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.user_id],
            foreignColumns: [usersTable.id],
        }),
    ]
);

export const tagsTable = pgTable("tags", {
    id: uuid()
        .$defaultFn(() => v7())
        .primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp({ withTimezone: true }),
});

export const userInterestsTable = pgTable(
    "user_interests",
    {
        id: uuid()
            .$defaultFn(() => v7())
            .primaryKey(),
        user_id: uuid().notNull(),
        tag_id: uuid().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.user_id],
            foreignColumns: [usersTable.id],
        }),
        foreignKey({
            columns: [table.tag_id],
            foreignColumns: [tagsTable.id],
        }),
    ]
);

export const filesTable = pgTable("files", {
    id: uuid()
        .$defaultFn(() => v7())
        .primaryKey(),
    bucket: varchar({ length: 255 }).notNull(),
    key: varchar({ length: 255 }).notNull(),
    filename: varchar({ length: 255 }).notNull(),
    mimetype: varchar({ length: 100 }).notNull(),
    size: integer().notNull(),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const activitiesTable = pgTable(
    "activities",
    {
        id: uuid()
            .$defaultFn(() => v7())
            .primaryKey(),
        owner_id: uuid().notNull(),
        title: text().notNull(),
        thumbnail_file_id: uuid().notNull(),
        description: text().notNull(),
        description_short: text().notNull(),
        approved: boolean().notNull().default(false),
        registration_open_at: timestamp({ withTimezone: true }).notNull(),
        registration_close_at: timestamp({ withTimezone: true }).notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.owner_id],
            foreignColumns: [usersTable.id],
        }),
        foreignKey({
            columns: [table.thumbnail_file_id],
            foreignColumns: [filesTable.id],
        }),
    ]
);

export const activitySchedulesTable = pgTable(
    "activity_schedules",
    {
        id: uuid()
            .$defaultFn(() => v7())
            .primaryKey(),
        activity_id: uuid().notNull(),
        event_start_at: timestamp({ withTimezone: true }).notNull(),
        price: integer().notNull(),
        max_users: integer().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.activity_id],
            foreignColumns: [activitiesTable.id],
        }),
    ]
);

export const activityTagsTable = pgTable(
    "activity_tags",
    {
        id: uuid()
            .$defaultFn(() => v7())
            .primaryKey(),
        activity_id: uuid().notNull(),
        tag_id: uuid().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.activity_id],
            foreignColumns: [activitiesTable.id],
        }),
        foreignKey({
            columns: [table.tag_id],
            foreignColumns: [tagsTable.id],
        }),
    ]
);

export const activityImagesTable = pgTable(
    "activity_images",
    {
        id: uuid()
            .$defaultFn(() => v7())
            .primaryKey(),
        activity_id: uuid().notNull(),
        file_id: uuid().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.activity_id],
            foreignColumns: [activitiesTable.id],
        }),
        foreignKey({
            columns: [table.file_id],
            foreignColumns: [filesTable.id],
        }),
    ]
);

export const activityFilesTable = pgTable(
    "activity_files",
    {
        id: uuid()
            .$defaultFn(() => v7())
            .primaryKey(),
        activity_id: uuid().notNull(),
        file_id: uuid().notNull(),
        file_type: fileTypeEnum("file_type").notNull().default("attachment"),
        display_name: varchar({ length: 255 }),
    },
    (table) => [
        foreignKey({
            columns: [table.activity_id],
            foreignColumns: [activitiesTable.id],
        }),
        foreignKey({
            columns: [table.file_id],
            foreignColumns: [filesTable.id],
        }),
    ]
);

export const activityUsersTable = pgTable(
    "activity_users",
    {
        id: uuid()
            .$defaultFn(() => v7())
            .primaryKey(),
        schedule_id: uuid().notNull(),
        student_information_id: uuid().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.schedule_id],
            foreignColumns: [activitySchedulesTable.id],
        }),
        foreignKey({
            columns: [table.student_information_id],
            foreignColumns: [studentInformationTable.id],
        }),
    ]
);

export const activityHistoryTable = pgTable(
    "activity_history",
    {
        id: uuid()
            .$defaultFn(() => v7())
            .primaryKey(),
        schedule_id: uuid().notNull(),
        user_id: uuid().notNull(),
        joined_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        foreignKey({
            columns: [table.schedule_id],
            foreignColumns: [activitySchedulesTable.id],
        }),
        foreignKey({
            columns: [table.user_id],
            foreignColumns: [usersTable.id],
        }),
    ]
);

export const transactionsTable = pgTable("transactions", {
    id: uuid()
        .$defaultFn(() => v7())
        .primaryKey(),
    amount: integer().notNull(),
    balance_before: integer().notNull(),
    balance_after: integer().notNull(),
    user_id: uuid().notNull(),
    transaction_type: transactionTypeEnum("transaction_type").notNull(),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const topupTransactionsTable = pgTable(
    "topup_transactions",
    {
        id: uuid()
            .$defaultFn(() => v7())
            .primaryKey(),
        user_id: uuid().notNull(),
        transaction_id: uuid().notNull(),
        file_id: uuid().notNull(),
        payload: text().notNull(),
        transaction_ref: text().notNull(),
        amount: integer().notNull(),
        status: topupStatusEnum("status").default("pending").notNull(),
        created_at: timestamp().defaultNow().notNull(),
        approved_at: timestamp(),
    },
    (table) => [
        foreignKey({
            columns: [table.user_id],
            foreignColumns: [usersTable.id],
        }),
        foreignKey({
            columns: [table.transaction_id],
            foreignColumns: [transactionsTable.id],
        }),
        foreignKey({
            columns: [table.file_id],
            foreignColumns: [filesTable.id],
        }),
    ]
);
