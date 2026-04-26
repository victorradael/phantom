-- Migration 002: add hash index on links.url for URL-based equality lookups
-- Hash indexes are optimal for exact-match queries on long text columns.
CREATE INDEX ix_links_url ON links USING hash (url);
