-- lambda/initialize-db/sql/kb_tables.sql

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create schema for Bedrock integration
CREATE SCHEMA IF NOT EXISTS ${KB_SCHEMA_NAME};

-- Create the Bedrock knowledge base table with correct vector dimension
CREATE TABLE IF NOT EXISTS ${KB_SCHEMA_NAME}.${KB_MAIN_TABLE_NAME} (
    id uuid PRIMARY KEY,
    embedding vector(1024),
    chunks text,
    metadata jsonb,
    custom_metadata jsonb
);

-- Create indexes for Bedrock knowledge base
DO $$
BEGIN
    -- Embedding index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = '${KB_MAIN_TABLE_NAME}_embedding_idx'
    ) THEN
        CREATE INDEX ${KB_MAIN_TABLE_NAME}_embedding_idx 
        ON ${KB_SCHEMA_NAME}.${KB_MAIN_TABLE_NAME} 
        USING hnsw (embedding vector_cosine_ops) 
        WITH (ef_construction=256);
    END IF;

    -- Text search index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = '${KB_MAIN_TABLE_NAME}_chunks_idx'
    ) THEN
        CREATE INDEX ${KB_MAIN_TABLE_NAME}_chunks_idx 
        ON ${KB_SCHEMA_NAME}.${KB_MAIN_TABLE_NAME} 
        USING gin (to_tsvector('simple', chunks));
    END IF;

    -- Metadata indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = '${KB_MAIN_TABLE_NAME}_metadata_idx'
    ) THEN
        CREATE INDEX ${KB_MAIN_TABLE_NAME}_metadata_idx 
        ON ${KB_SCHEMA_NAME}.${KB_MAIN_TABLE_NAME} 
        USING gin (metadata);
    END IF;

    -- Policy number specific index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = '${KB_MAIN_TABLE_NAME}_policy_number_idx'
    ) THEN
        CREATE INDEX ${KB_MAIN_TABLE_NAME}_policy_number_idx 
        ON ${KB_SCHEMA_NAME}.${KB_MAIN_TABLE_NAME} 
        USING btree ((metadata->>'policy_number'));
    END IF;

    -- Custom metadata index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = '${KB_MAIN_TABLE_NAME}_custom_metadata_idx'
    ) THEN
        CREATE INDEX ${KB_MAIN_TABLE_NAME}_custom_metadata_idx 
        ON ${KB_SCHEMA_NAME}.${KB_MAIN_TABLE_NAME} 
        USING gin (custom_metadata);
    END IF;
END
$$;

-- Create documents table for general knowledge base
CREATE TABLE IF NOT EXISTS ${KB_SCHEMA_NAME}.kb_documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on kb_documents metadata
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'kb_documents_metadata_idx'
    ) THEN
        CREATE INDEX kb_documents_metadata_idx 
        ON ${KB_SCHEMA_NAME}.kb_documents 
        USING gin (metadata);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'kb_documents_policy_number_idx'
    ) THEN
        CREATE INDEX kb_documents_policy_number_idx 
        ON ${KB_SCHEMA_NAME}.kb_documents 
        USING btree ((metadata->>'policy_number'));
    END IF;
END
$$;

-- Create categories table
CREATE TABLE IF NOT EXISTS ${KB_SCHEMA_NAME}.kb_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Create document categories junction table
CREATE TABLE IF NOT EXISTS ${KB_SCHEMA_NAME}.kb_document_categories (
    document_id INTEGER REFERENCES ${KB_SCHEMA_NAME}.kb_documents(id),
    category_id INTEGER REFERENCES ${KB_SCHEMA_NAME}.kb_categories(id),
    PRIMARY KEY (document_id, category_id)
);

-- Create or replace function to update timestamp
CREATE OR REPLACE FUNCTION ${KB_SCHEMA_NAME}.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_kb_documents_updated_at ON ${KB_SCHEMA_NAME}.kb_documents;
CREATE TRIGGER update_kb_documents_updated_at
    BEFORE UPDATE ON ${KB_SCHEMA_NAME}.kb_documents
    FOR EACH ROW
    EXECUTE FUNCTION ${KB_SCHEMA_NAME}.update_updated_at_column();

-- Create index on embedding for similarity search
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'kb_documents_embedding_idx'
    ) THEN
        CREATE INDEX kb_documents_embedding_idx 
        ON ${KB_SCHEMA_NAME}.kb_documents 
        USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100);
    END IF;
END
$$;
