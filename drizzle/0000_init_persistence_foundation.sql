CREATE TYPE "public"."access_request_status" AS ENUM('draft', 'submitted', 'under_review', 'needs_information', 'approved', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."environment" AS ENUM('development', 'staging', 'production');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('requester', 'reviewer', 'security_reviewer', 'administrator');--> statement-breakpoint
CREATE TABLE "access_request_scopes" (
	"access_request_id" uuid NOT NULL,
	"api_scope_id" uuid NOT NULL,
	"api_product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_request_scopes_access_request_id_api_scope_id_pk" PRIMARY KEY("access_request_id","api_scope_id")
);
--> statement-breakpoint
CREATE TABLE "access_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"requester_team_id" uuid NOT NULL,
	"api_product_id" uuid NOT NULL,
	"environment" "environment" NOT NULL,
	"status" "access_request_status" DEFAULT 'draft' NOT NULL,
	"justification" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_requests_id_product_id_key" UNIQUE("id","api_product_id"),
	CONSTRAINT "access_requests_justification_not_empty" CHECK (length(trim("access_requests"."justification")) > 0),
	CONSTRAINT "access_requests_version_positive" CHECK ("access_requests"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "api_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_products_name_unique" UNIQUE("name"),
	CONSTRAINT "api_products_name_not_empty" CHECK (length(trim("api_products"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "api_scopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_privileged" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_scopes_product_id_name_key" UNIQUE("api_product_id","name"),
	CONSTRAINT "api_scopes_id_product_id_key" UNIQUE("id","api_product_id"),
	CONSTRAINT "api_scopes_name_not_empty" CHECK (length(trim("api_scopes"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"key" "role" PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_name_unique" UNIQUE("name"),
	CONSTRAINT "teams_name_not_empty" CHECK (length(trim("teams"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_key" "role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_key_pk" PRIMARY KEY("user_id","role_key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"team_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_name_not_empty" CHECK (length(trim("users"."name")) > 0),
	CONSTRAINT "users_email_not_empty" CHECK (length(trim("users"."email")) > 0)
);
--> statement-breakpoint
ALTER TABLE "access_request_scopes" ADD CONSTRAINT "access_request_scopes_request_product_fk" FOREIGN KEY ("access_request_id","api_product_id") REFERENCES "public"."access_requests"("id","api_product_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_request_scopes" ADD CONSTRAINT "access_request_scopes_scope_product_fk" FOREIGN KEY ("api_scope_id","api_product_id") REFERENCES "public"."api_scopes"("id","api_product_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_requester_team_id_teams_id_fk" FOREIGN KEY ("requester_team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_api_product_id_api_products_id_fk" FOREIGN KEY ("api_product_id") REFERENCES "public"."api_products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_scopes" ADD CONSTRAINT "api_scopes_api_product_id_api_products_id_fk" FOREIGN KEY ("api_product_id") REFERENCES "public"."api_products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_key_roles_key_fk" FOREIGN KEY ("role_key") REFERENCES "public"."roles"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_request_scopes_api_scope_id_idx" ON "access_request_scopes" USING btree ("api_scope_id");--> statement-breakpoint
CREATE INDEX "access_requests_requester_id_idx" ON "access_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "access_requests_api_product_id_idx" ON "access_requests" USING btree ("api_product_id");--> statement-breakpoint
CREATE INDEX "access_requests_status_idx" ON "access_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "api_scopes_product_id_idx" ON "api_scopes" USING btree ("api_product_id");--> statement-breakpoint
CREATE INDEX "users_team_id_idx" ON "users" USING btree ("team_id");