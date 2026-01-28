import { pgTable, text, timestamp, unique, boolean, foreignKey, pgEnum, jsonb } from "drizzle-orm/pg-core"
import { sql, relations } from "drizzle-orm"

export const maintenanceItemStatus = pgEnum("maintenance_item_status", ['OK', 'Error', 'InProgress', 'NotApplicable', 'Planned', 'NotDone'])

// New enum definitions for System table
export const hardwareTypeEnum = pgEnum('hardware_type', ['PHYSICAL', 'VIRTUAL']);
export const operatingSystemEnum = pgEnum('operating_system', [
	'WIN_SVR_2012_R2', 'WIN_SVR_2016', 'WIN_SVR_2019', 'WIN_SVR_2022', 'WIN_SVR_2025',
	'WIN_10', 'WIN_11',
	'DEBIAN_10', 'DEBIAN_11', 'DEBIAN_12',
	'CENTOS_7', 'CENTOS_8', 'CENTOS_9',
	'UBUNTU_18', 'UBUNTU_20', 'UBUNTU_22',
	'AMAZON_LINUX_2', 'AMAZON_LINUX_2023',
	'LINUX', 'MACOS', 'ESXI',
	'OTHER_OS'
]);
export const serverApplicationTypeEnum = pgEnum('server_application_type', [
	'EXCHANGE', 'SQL', 'FILE', 'DOMAIN', 'BACKUP', 'RDS', 'APPLICATION', 'OTHER', 'NONE'
]);

// New settings table
export const settings = pgTable("settings", {
	key: text("key").primaryKey().notNull(),
	value: jsonb("value").notNull(),
	createdAt: timestamp("created_at", { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});


export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	freshserviceId: text("freshservice_id"),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
	sessions: many(session),
}));

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(), // Better Auth expects this field
	providerAccountId: text("provider_account_id"), // Make nullable for Better Auth
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "account_user_id_user_id_fk"
	}).onDelete("cascade"),
]);

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const maintenance = pgTable("maintenance", {
	id: text().primaryKey().notNull(),
	customerId: text("customer_id").notNull(), // New: direct link to customer
	title: text("title").notNull(), // New: Maintenance Title
	systemIds: text("system_ids").array(), // New: Array of system IDs
	systemNotes: jsonb("system_notes").$type<Record<string, string>>().default({}), // New: Notes for each system (systemId -> note)
	systemTechnicianAssignments: jsonb("system_technician_assignments").$type<Record<string, string[]>>().default({}), // New: Technician assignments per system (systemId -> [technicianId, ...])
	systemTrackableItems: jsonb("system_trackable_items").$type<Record<string, Record<string, string | undefined>>>().default({}), // New: Trackable items statuses per system
	technicianIds: text("technician_ids").array(), // Changed from technicianId to technicianIds (array)
	coordinatorId: text("coordinator_id"), // New: Single coordinator for the maintenance entry
	date: timestamp({ mode: 'string' }).notNull(),
	notes: text(),
	instructions: text(), // New: Instructions field
	status: maintenanceItemStatus("status").notNull(), // New: Status field
	createdAt: timestamp("created_at", { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.customerId],
		foreignColumns: [customer.id],
		name: "maintenance_customer_id_customer_id_fk" // Updated foreign key name
	}).onDelete("cascade"),
]);

export const maintenanceRelations = relations(maintenance, ({ one }) => ({
	customer: one(customer, {
		fields: [maintenance.customerId],
		references: [customer.id],
	}),
}));

export const checklistItem = pgTable("checklist_item", {
	id: text().primaryKey().notNull(),
	maintenanceId: text("maintenance_id").notNull(),
	name: text().notNull(),
	status: maintenanceItemStatus().notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.maintenanceId],
		foreignColumns: [maintenance.id],
		name: "checklist_item_maintenance_id_maintenance_id_fk"
	}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "session_user_id_user_id_fk"
	}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const customer = pgTable("customer", {
	id: text().primaryKey().notNull(),
	freshserviceId: text("freshservice_id"),
	name: text().notNull(),
	address: text(),
	city: text(),
	postalCode: text("postal_code"),
	country: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	category: text(),
	billingCode: text("billing_code"),
	serviceManager: text("service_manager"),
	abbreviation: text().notNull(),
	businessEmail: text("business_email"),
	businessPhone: text("business_phone"),
	website: text(),
	customerInstructions: jsonb("customer_instructions").$type<Array<{ type: 'text' | 'image', content: string }>>().default([]), // New: Customer-specific instructions with images
	maintenanceNotes: text("maintenance_notes"), // New: Persistent maintenance notes (HTML content from editor)
	sla: boolean("sla").default(false), // New: SLA field
}, (table) => [
	unique("customer_abbreviation_unique").on(table.abbreviation),
]);

export const customerRelations = relations(customer, ({ many }) => ({
	maintenanceEntries: many(maintenance),
	contactPeople: many(contactPerson),
	systems: many(system),
}));

export const system = pgTable("system", {
	id: text('id').primaryKey(),
	freshserviceId: text("freshservice_id"),
	customerId: text("customer_id").notNull(),
	hostname: text('hostname').notNull(),
	ipAddress: text('ip_address'),
	description: text(),
	openApiDefinition: text('open_api_definition'),
	hardwareType: hardwareTypeEnum('hardware_type').notNull(),
	operatingSystem: operatingSystemEnum('operating_system').notNull(),
	serverApplicationType: serverApplicationTypeEnum('server_application_type'),
	installedSoftware: text("installed_software").array().default([]), // New: Array of installed software
	maintenanceInterval: text("maintenance_interval"), // New: maintenanceInterval field
	maintenanceTechnician: text("maintenance_technician"), // Wartungstechniker from Freshservice
	createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.customerId],
		foreignColumns: [customer.id],
		name: "system_customer_id_customer_id_fk"
	}).onDelete("cascade"),
]);

export const systemRelations = relations(system, ({ one }) => ({
	customer: one(customer, {
		fields: [system.customerId],
		references: [customer.id],
	}),
}));

export const contactPerson = pgTable("contact_person", {
	id: text().primaryKey().notNull(),
	freshserviceId: text("freshservice_id"),
	customerId: text("customer_id").notNull(),
	name: text().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.customerId],
		foreignColumns: [customer.id],
		name: "contact_person_customer_id_customer_id_fk"
	}).onDelete("cascade"),
]);

export const contactPersonRelations = relations(contactPerson, ({ one }) => ({
	customer: one(customer, {
		fields: [contactPerson.customerId],
		references: [customer.id],
	}),
}));
