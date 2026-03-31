-- Migration 001: create workspaces and links tables

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE workspaces (
    id         SERIAL PRIMARY KEY,
    uuid       UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX ix_workspaces_uuid ON workspaces (uuid);

CREATE TABLE links (
    id           SERIAL PRIMARY KEY,
    uuid         UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    url          VARCHAR(2048) NOT NULL,
    name         VARCHAR(255),
    description  TEXT,
    workspace_id INTEGER      NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX ix_links_uuid         ON links (uuid);
CREATE INDEX ix_links_workspace_id ON links (workspace_id);
